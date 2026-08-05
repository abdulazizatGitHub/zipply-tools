import { defineEnv, z } from '@toolforge/env';

/**
 * pdf-service environment.
 * Validation runs at module import (first load at boot). A bad config fails
 * the process before any request is served.
 */
export const env = defineEnv({
  service: 'pdf-service',
  schema: z.object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8081),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

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

    // Phase 2: replaced by HTTP @toolforge/files-client pointing at services/files.
    // For now, tools use an in-memory FilesClient and a dev-only upload route.
    ENABLE_DEV_UPLOAD_ROUTE: z
      .enum(['true', 'false'])
      .default('true')
      .transform((s) => s === 'true'),

    OTEL_SERVICE_NAME: z.string().default('pdf-service'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  }),
});

export type Env = typeof env;
