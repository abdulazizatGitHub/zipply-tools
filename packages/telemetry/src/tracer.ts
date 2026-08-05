/**
 * OpenTelemetry tracer wrapper.
 *
 * Use `withSpan` to wrap a synchronous or async unit of work in a span.
 * Errors thrown inside the callback are recorded on the span and re-thrown.
 */

import { SpanKind, SpanStatusCode, trace, type Span, type Tracer } from '@opentelemetry/api';

const DEFAULT_TRACER_NAME = '@toolforge/telemetry';

export function getTracer(name: string = DEFAULT_TRACER_NAME): Tracer {
  return trace.getTracer(name);
}

export interface SpanOptions {
  kind?: SpanKind;
  attributes?: Record<string, string | number | boolean>;
  tracerName?: string;
}

export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  options: SpanOptions = {},
): Promise<T> {
  const tracer = getTracer(options.tracerName);
  return tracer.startActiveSpan(
    name,
    { kind: options.kind ?? SpanKind.INTERNAL, attributes: options.attributes },
    async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err instanceof Error ? err.message : String(err),
        });
        throw err;
      } finally {
        span.end();
      }
    },
  );
}

export function currentTraceId(): string | undefined {
  return trace.getActiveSpan()?.spanContext().traceId;
}

export { SpanKind, SpanStatusCode };
