import { defineEnv, z } from '@toolforge/env';

/**
 * api-gateway environment.
 * Validation runs at module import (i.e. first load of this file at boot).
 * A bad config fails the process before any request is served.
 */
export const env = defineEnv({
  service: 'api-gateway',
  schema: z.object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // In Phase 2 identity is still a stub — optional with a localhost default
    // so the gateway can boot in dev without a real Clerk deployment.
    IDENTITY_BASE_URL: z.string().url().optional(),

    // Upstream service URLs. Defaults to local dev ports.
    PDF_SERVICE_URL: z.string().url().default('http://localhost:8081'),
    QR_SERVICE_URL: z.string().url().default('http://localhost:8082'),

    CORS_ALLOWED_ORIGINS: z
      .string()
      .default('')
      .transform((s) =>
        s
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),

    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
    RATE_LIMIT_TIMEWINDOW_MS: z.coerce.number().int().positive().default(60_000),

    // Telemetry — read by instrumentation.ts before any business code.
    OTEL_SERVICE_NAME: z.string().default('api-gateway'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  }),
});

export type Env = typeof env;
