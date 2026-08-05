/**
 * Client-side error type produced by HttpClient. Wraps a ProblemDetails
 * payload from upstream when present, or a raw transport/timeout failure.
 */

export interface ProblemDetailsResponse {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code?: string;
  retryable?: boolean;
  traceId?: string;
  details?: Record<string, unknown>;
}

export class ClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly problem: ProblemDetailsResponse | undefined;
  public override readonly cause: unknown;

  constructor(params: {
    message: string;
    status: number;
    code?: string;
    retryable?: boolean;
    problem?: ProblemDetailsResponse;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'ClientError';
    this.status = params.status;
    this.code = params.code ?? 'client.unknown';
    this.retryable = params.retryable ?? false;
    this.problem = params.problem;
    this.cause = params.cause;
  }
}

export function parseProblemDetails(raw: unknown): ProblemDetailsResponse | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.status !== 'number' || typeof obj.title !== 'string') {
    return undefined;
  }
  return {
    type: typeof obj.type === 'string' ? obj.type : 'about:blank',
    title: obj.title,
    status: obj.status,
    detail: typeof obj.detail === 'string' ? obj.detail : undefined,
    code: typeof obj.code === 'string' ? obj.code : undefined,
    retryable: typeof obj.retryable === 'boolean' ? obj.retryable : undefined,
    traceId: typeof obj.traceId === 'string' ? obj.traceId : undefined,
    details:
      obj.details && typeof obj.details === 'object'
        ? (obj.details as Record<string, unknown>)
        : undefined,
  };
}
