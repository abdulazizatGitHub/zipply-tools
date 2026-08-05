/**
 * Reusable env sub-schemas. Services compose these.
 *
 * Example:
 *   const schema = z.object({
 *     ...platformBaseSchema.shape,
 *     ...postgresSchema.shape,
 *     SERVICE_PORT: z.coerce.number().int().positive().default(8080),
 *   });
 */

import { z } from 'zod';

export const nodeEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const platformBaseSchema = z.object({
  TOOLFORGE_ENV: z.enum(['local', 'preview', 'staging', 'production']).default('local'),
  TOOLFORGE_REGION: z.string().default('us-east-1'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export const otelSchema = z.object({
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().optional(),
  OTEL_RESOURCE_ATTRIBUTES: z.string().optional(),
  OTEL_TRACES_SAMPLER: z.string().default('parentbased_traceidratio'),
  OTEL_TRACES_SAMPLER_ARG: z.coerce.number().min(0).max(1).default(0.1),
});

export const postgresSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export const redisSchema = z.object({
  REDIS_URL: z.string().url(),
});

export const storageSchema = z.object({
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_REGION: z.string().default('auto'),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
});

export const sentrySchema = z.object({
  SENTRY_DSN: z.string().url().optional(),
});
