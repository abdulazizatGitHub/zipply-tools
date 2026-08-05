import { defineEnv, z } from '@toolforge/env';

/**
 * Web env split: server vars validated at module load; NEXT_PUBLIC_* are
 * inlined by Next.js at build time and accessed via process.env in client
 * code. We expose typed accessors so usage stays clean and discoverable.
 */
export const serverEnv = defineEnv({
  service: 'web',
  schema: z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    OTEL_SERVICE_NAME: z.string().default('web'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  }),
});

export const publicEnv = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
} as const;
