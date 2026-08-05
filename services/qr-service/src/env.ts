import { defineEnv, z } from '@toolforge/env';

export const env = defineEnv({
  service: 'qr-service',
  schema: z.object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8082),
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

    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
    RATE_LIMIT_TIMEWINDOW_MS: z.coerce.number().int().positive().default(60_000),

    OTEL_SERVICE_NAME: z.string().default('qr-service'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  }),
});

export type Env = typeof env;
