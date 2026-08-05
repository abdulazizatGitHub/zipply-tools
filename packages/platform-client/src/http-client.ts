/**
 * HttpClient — the base every internal service client extends.
 *
 * Responsibilities:
 *   - Compose URL from baseUrl + path + query
 *   - Inject trace propagation headers via current OTel span
 *   - JSON body encode/decode
 *   - Retry idempotent calls with exponential backoff + jitter
 *   - Translate non-2xx into ClientError (ProblemDetails-aware)
 *   - Apply per-call and default timeout via AbortSignal
 */

import { TELEMETRY_HEADERS, currentTraceId } from '@toolforge/telemetry';

import { ClientError, parseProblemDetails } from './errors.js';

import type { RequestOptions, RetryPolicy } from './types.js';

export interface HttpClientOptions {
  baseUrl: string;
  serviceName: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeoutMs?: number;
  retry?: Partial<RetryPolicy>;
  /** Override the global fetch (useful for tests). */
  fetchImpl?: typeof fetch;
}

const DEFAULT_RETRY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2_000,
  retryStatuses: [408, 425, 429, 500, 502, 503, 504],
};

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT']);

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });
}

function backoff(policy: RetryPolicy, attempt: number): number {
  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
  const jitter = Math.random() * exp * 0.25;
  return Math.floor(exp + jitter);
}

export class HttpClient {
  protected readonly baseUrl: string;
  protected readonly serviceName: string;
  protected readonly defaultHeaders: Record<string, string>;
  protected readonly defaultTimeoutMs: number;
  protected readonly retry: RetryPolicy;
  protected readonly fetchImpl: typeof fetch;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.serviceName = options.serviceName;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 10_000;
    this.retry = { ...DEFAULT_RETRY, ...options.retry };
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
  }

  protected buildUrl(path: string, query?: RequestOptions['query']): string {
    const url = new URL(
      path.startsWith('/') ? `${this.baseUrl}${path}` : `${this.baseUrl}/${path}`,
    );
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  protected buildHeaders(extra?: Record<string, string>): Headers {
    const headers = new Headers({
      'content-type': 'application/json',
      accept: 'application/json',
      [TELEMETRY_HEADERS.REQUEST_ID]: crypto.randomUUID(),
      ...this.defaultHeaders,
      ...extra,
    });
    const traceId = currentTraceId();
    if (traceId && !headers.has(TELEMETRY_HEADERS.TRACEPARENT)) {
      // Minimal traceparent — proper W3C propagation is wired by OTel
      // auto-instrumentation when present; this is the fallback.
      headers.set(TELEMETRY_HEADERS.TRACEPARENT, `00-${traceId}-0000000000000000-01`);
    }
    return headers;
  }

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const method = options.method ?? 'GET';
    const idempotent = options.idempotent ?? IDEMPOTENT_METHODS.has(method);
    const retry = { ...this.retry, ...options.retry };
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options.headers);
    const body = options.body !== undefined ? JSON.stringify(options.body) : undefined;

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;

    let attempt = 0;
    let lastError: unknown;

    while (attempt < retry.maxAttempts) {
      const timeoutController = new AbortController();
      const timer = setTimeout(() => {
        timeoutController.abort();
      }, timeoutMs);
      const composed = options.signal
        ? AbortSignal.any([options.signal, timeoutController.signal])
        : timeoutController.signal;

      try {
        const res = await this.fetchImpl(url, {
          method,
          headers,
          body,
          signal: composed,
        });

        if (res.ok) {
          if (res.status === 204) return undefined as T;
          const ct = res.headers.get('content-type') ?? '';
          if (ct.includes('application/json')) {
            return (await res.json()) as T;
          }
          return (await res.text()) as unknown as T;
        }

        // Non-2xx — parse ProblemDetails if present.
        const rawBody = await res.json().catch(() => undefined as unknown);
        const problem = parseProblemDetails(rawBody);
        const err = new ClientError({
          message: problem?.detail ?? problem?.title ?? `HTTP ${String(res.status)}`,
          status: res.status,
          code: problem?.code,
          retryable: problem?.retryable ?? retry.retryStatuses.includes(res.status),
          problem,
        });

        if (!err.retryable || !idempotent) throw err;
        lastError = err;
      } catch (err) {
        if (err instanceof ClientError) {
          if (!err.retryable || !idempotent) throw err;
          lastError = err;
        } else {
          // Network / abort / timeout — retry only if idempotent.
          if (!idempotent) {
            throw new ClientError({
              message: err instanceof Error ? err.message : 'request failed',
              status: 0,
              code: 'client.transport',
              cause: err,
            });
          }
          lastError = err;
        }
      } finally {
        clearTimeout(timer);
      }

      attempt += 1;
      if (attempt < retry.maxAttempts) {
        await sleep(backoff(retry, attempt), options.signal);
      }
    }

    if (lastError instanceof ClientError) throw lastError;
    throw new ClientError({
      message: 'exhausted retries',
      status: 0,
      code: 'client.retry_exhausted',
      cause: lastError,
    });
  }

  // Convenience verbs --------------------------------------------------------

  get<T>(path: string, opts: Omit<RequestOptions, 'method' | 'path'> = {}): Promise<T> {
    return this.request<T>({ ...opts, method: 'GET', path });
  }

  post<T>(path: string, opts: Omit<RequestOptions, 'method' | 'path'> = {}): Promise<T> {
    return this.request<T>({ ...opts, method: 'POST', path });
  }

  put<T>(path: string, opts: Omit<RequestOptions, 'method' | 'path'> = {}): Promise<T> {
    return this.request<T>({ ...opts, method: 'PUT', path });
  }

  patch<T>(path: string, opts: Omit<RequestOptions, 'method' | 'path'> = {}): Promise<T> {
    return this.request<T>({ ...opts, method: 'PATCH', path });
  }

  delete<T>(path: string, opts: Omit<RequestOptions, 'method' | 'path'> = {}): Promise<T> {
    return this.request<T>({ ...opts, method: 'DELETE', path });
  }
}
