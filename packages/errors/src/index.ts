/**
 * @toolforge/errors
 *
 * Shared error taxonomy for ToolForge services and tools.
 *
 * Every PlatformError carries:
 *   - `code`         a stable machine identifier (snake.case namespaced)
 *   - `status`       the HTTP status it serializes to
 *   - `message`      a human-readable message
 *   - `details`      optional structured context
 *   - `cause`        the underlying error, preserved for tracing
 *   - `retryable`    hint to the caller — DO they retry, or NOT
 *
 * On the wire we use RFC 7807 Problem Details. The api-gateway is responsible
 * for catching PlatformError instances and serializing; tools and services
 * just throw the right class.
 */

export type ErrorCode = string;

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: ErrorCode;
  retryable: boolean;
  traceId?: string;
  details?: Record<string, unknown>;
}

export interface PlatformErrorOptions {
  message: string;
  code?: ErrorCode;
  details?: Record<string, unknown>;
  cause?: unknown;
  retryable?: boolean;
}

export abstract class PlatformError extends Error {
  public abstract readonly status: number;
  public readonly code: ErrorCode;
  public readonly details: Record<string, unknown> | undefined;
  public readonly retryable: boolean;
  public override readonly cause: unknown;

  constructor(defaultCode: ErrorCode, options: PlatformErrorOptions) {
    super(options.message);
    this.name = new.target.name;
    this.code = options.code ?? defaultCode;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }

  toProblemDetails(traceId?: string, instance?: string): ProblemDetails {
    return {
      type: `https://errors.toolforge.dev/${this.code}`,
      title: this.name,
      status: this.status,
      detail: this.message,
      ...(instance && { instance }),
      code: this.code,
      retryable: this.retryable,
      ...(traceId && { traceId }),
      ...(this.details && { details: this.details }),
    };
  }
}

// ----- 4xx: client errors ---------------------------------------------------

export class ValidationError extends PlatformError {
  readonly status = 400;
  constructor(options: PlatformErrorOptions) {
    super('validation.failed', options);
  }
}

export class UnauthorizedError extends PlatformError {
  readonly status = 401;
  constructor(options: PlatformErrorOptions) {
    super('auth.unauthorized', options);
  }
}

export class ForbiddenError extends PlatformError {
  readonly status = 403;
  constructor(options: PlatformErrorOptions) {
    super('auth.forbidden', options);
  }
}

export class NotFoundError extends PlatformError {
  readonly status = 404;
  constructor(options: PlatformErrorOptions) {
    super('resource.not_found', options);
  }
}

export class ConflictError extends PlatformError {
  readonly status = 409;
  constructor(options: PlatformErrorOptions) {
    super('resource.conflict', options);
  }
}

export class PayloadTooLargeError extends PlatformError {
  readonly status = 413;
  constructor(options: PlatformErrorOptions) {
    super('payload.too_large', options);
  }
}

export class UnsupportedMediaTypeError extends PlatformError {
  readonly status = 415;
  constructor(options: PlatformErrorOptions) {
    super('payload.unsupported_media_type', options);
  }
}

export class RateLimitedError extends PlatformError {
  readonly status = 429;
  constructor(options: PlatformErrorOptions) {
    super('rate.limited', { retryable: true, ...options });
  }
}

export class QuotaExceededError extends PlatformError {
  readonly status = 402;
  constructor(options: PlatformErrorOptions) {
    super('quota.exceeded', options);
  }
}

// ----- 5xx: server errors ---------------------------------------------------

export class InternalError extends PlatformError {
  readonly status = 500;
  constructor(options: PlatformErrorOptions) {
    super('internal.error', options);
  }
}

export class NotImplementedError extends PlatformError {
  readonly status = 501;
  constructor(options: PlatformErrorOptions) {
    super('not_implemented', options);
  }
}

export class UpstreamError extends PlatformError {
  readonly status = 502;
  constructor(options: PlatformErrorOptions) {
    super('upstream.error', { retryable: true, ...options });
  }
}

export class ServiceUnavailableError extends PlatformError {
  readonly status = 503;
  constructor(options: PlatformErrorOptions) {
    super('service.unavailable', { retryable: true, ...options });
  }
}

export class UpstreamTimeoutError extends PlatformError {
  readonly status = 504;
  constructor(options: PlatformErrorOptions) {
    super('upstream.timeout', { retryable: true, ...options });
  }
}

// ----- helpers --------------------------------------------------------------

export function isPlatformError(value: unknown): value is PlatformError {
  return value instanceof PlatformError;
}

/**
 * Coerce any unknown thrown value into a PlatformError.
 * Use at HTTP error boundaries so the wire format is always consistent.
 */
export function toPlatformError(err: unknown): PlatformError {
  if (isPlatformError(err)) return err;
  if (err instanceof Error) {
    return new InternalError({ message: err.message, cause: err });
  }
  return new InternalError({
    message: 'Unknown error',
    cause: err,
    details: { thrown: typeof err },
  });
}
