/**
 * @toolforge/telemetry — public API.
 *
 * Two entry points:
 *   - default (this file): logger + tracer/meter wrappers, safe to import anywhere
 *   - /node              : Node SDK bootstrap; ONLY services import this, once
 */

export { createLogger, type Logger, type LogContext } from './logger.js';
export { getTracer, withSpan, currentTraceId, type SpanOptions } from './tracer.js';
export { getMeter } from './metrics.js';
export { TELEMETRY_HEADERS } from './headers.js';
