/**
 * @toolforge/sdk
 *
 * Official ToolForge SDK. Public, semver-bound, browser + Node compatible.
 * Unlike internal clients, this package:
 *   - Carries NO heavy validation deps (no zod at runtime — sizes matter)
 *   - Has no internal-only telemetry headers
 *   - Uses opaque types where shape isn't part of the contract
 *
 * Foundation phase ships the surface and a minimal HTTP core. Methods are
 * filled in Phase 2 alongside the public API.
 */

export interface ToolForgeClientOptions {
  /** API base URL. Defaults to https://api.toolforge.example. */
  baseUrl?: string;
  /** Bearer API key (server-side use). */
  apiKey?: string;
  /** Custom fetch (e.g. node-fetch, undici). */
  fetch?: typeof fetch;
  /** Default per-request timeout in ms. Default 30s. */
  timeoutMs?: number;
}

export class ToolForgeApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId: string | undefined;

  constructor(params: { message: string; status: number; code: string; requestId?: string }) {
    super(params.message);
    this.name = 'ToolForgeApiError';
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId;
  }
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export class ToolForgeClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: ToolForgeClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'https://api.toolforge.example').replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  protected async request<T>(config: RequestConfig): Promise<T> {
    const url = new URL(
      config.path.startsWith('/')
        ? `${this.baseUrl}${config.path}`
        : `${this.baseUrl}/${config.path}`,
    );
    if (config.query) {
      for (const [k, v] of Object.entries(config.query)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': '@toolforge/sdk',
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;

    const timeoutController = new AbortController();
    const timer = setTimeout(() => {
      timeoutController.abort();
    }, this.timeoutMs);
    const composed = config.signal
      ? AbortSignal.any([config.signal, timeoutController.signal])
      : timeoutController.signal;

    try {
      const res = await this.fetchImpl(url.toString(), {
        method: config.method ?? 'GET',
        headers,
        body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
        signal: composed,
      });

      const requestId = res.headers.get('x-toolforge-request-id') ?? undefined;
      if (!res.ok) {
        let detail = `HTTP ${String(res.status)}`;
        let code = 'http.error';
        try {
          const errBody = (await res.json()) as {
            detail?: string;
            title?: string;
            code?: string;
          };
          detail = errBody.detail ?? errBody.title ?? detail;
          if (typeof errBody.code === 'string') code = errBody.code;
        } catch {
          /* body wasn't JSON */
        }
        throw new ToolForgeApiError({
          message: detail,
          status: res.status,
          code,
          ...(requestId !== undefined ? { requestId } : {}),
        });
      }
      if (res.status === 204) return undefined as T;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        return (await res.json()) as T;
      }
      return (await res.text()) as unknown as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // Surface to be filled in Phase 2:
  //   tools.list(), tools.run(...), files.upload(...), jobs.get(...), etc.
}
