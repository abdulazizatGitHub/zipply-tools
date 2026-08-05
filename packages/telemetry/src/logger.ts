/**
 * Structured logger built on Pino.
 *
 * - JSON output in production (one event per line, ready for Loki/Datadog).
 * - Pretty output in development for readability.
 * - Automatic `traceId` / `spanId` enrichment when an OTel span is active.
 * - Redacts known sensitive paths from logged objects.
 *
 * The returned Logger is a real `pino.Logger`, so the standard `(obj, msg)`
 * call shape — and `.child(bindings)`, `.level`, etc. — work exactly as
 * pino documents them. This also makes it compatible with Fastify, which
 * accepts a pino instance directly.
 */

import { trace } from '@opentelemetry/api';
import pino, { type Logger as PinoLogger } from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  service: string;
  env?: string;
  region?: string;
  version?: string;
}

export interface CreateLoggerOptions extends LogContext {
  level?: LogLevel;
  /** Force pretty output. Defaults to true when env === 'development'. */
  pretty?: boolean;
}

export type Logger = PinoLogger;

/** Sensitive object keys auto-redacted from logged payloads. */
const REDACT_PATHS = [
  '*.password',
  '*.token',
  '*.apiKey',
  '*.api_key',
  '*.secret',
  '*.authorization',
  'headers.authorization',
  'headers.cookie',
  'req.headers.authorization',
  'req.headers.cookie',
];

export function createLogger(options: CreateLoggerOptions): Logger {
  const env = options.env ?? process.env.NODE_ENV ?? 'development';
  const level = options.level ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
  const pretty = options.pretty ?? env === 'development';

  const base: Record<string, unknown> = {
    service: options.service,
    env,
    ...(options.region && { region: options.region }),
    ...(options.version && { version: options.version }),
  };

  return pino({
    level,
    base,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
    formatters: {
      level: (label) => ({ level: label }),
    },
    mixin() {
      const span = trace.getActiveSpan();
      if (!span) return {};
      const ctx = span.spanContext();
      return { traceId: ctx.traceId, spanId: ctx.spanId };
    },
    ...(pretty && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
          sync: true,
        },
      },
    }),
  });
}
