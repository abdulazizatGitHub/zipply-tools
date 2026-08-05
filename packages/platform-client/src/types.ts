export interface RetryPolicy {
  /** Max attempts (1 = no retries). */
  maxAttempts: number;
  /** Base delay between attempts in ms. */
  baseDelayMs: number;
  /** Cap on backoff in ms. */
  maxDelayMs: number;
  /** HTTP status codes that trigger retry. */
  retryStatuses: readonly number[];
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Per-call idempotency override. POST/PATCH default to non-idempotent. */
  idempotent?: boolean;
  /** Per-call retry override. */
  retry?: Partial<RetryPolicy>;
  /** Per-call wall-clock timeout in ms. */
  timeoutMs?: number;
  /** Caller-provided AbortSignal (composed with timeout). */
  signal?: AbortSignal;
}
