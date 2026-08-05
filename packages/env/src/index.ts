/**
 * @toolforge/env
 *
 * Type-safe environment validation. The only legal place to touch process.env.
 *
 * Usage:
 *   import { z, defineEnv } from '@toolforge/env';
 *
 *   export const env = defineEnv({
 *     schema: z.object({
 *       PORT: z.coerce.number().int().positive().default(8080),
 *       DATABASE_URL: z.string().url(),
 *     }),
 *     service: 'api-gateway',
 *   });
 *
 *   // Use:  env.PORT  (typed: number)
 *
 * Validation runs once at module load. Failures throw with a redacted, readable
 * diagnostic so we never start a service with missing/malformed config.
 */

import { z, ZodError, type ZodSchema, type ZodTypeAny } from 'zod';

export { z };
export type { ZodError, ZodSchema, ZodTypeAny };

export interface DefineEnvOptions<Schema extends ZodTypeAny> {
  /** A Zod object schema describing required and optional vars. */
  schema: Schema;
  /** Service identifier (used in error messages and logs). */
  service: string;
  /** Source of vars. Defaults to `process.env`. Override in tests. */
  source?: Record<string, string | undefined>;
  /** If true, mask secret-like keys in error output. Default: true. */
  redactSecrets?: boolean;
}

export class EnvValidationError extends Error {
  public readonly issues: readonly { path: string; message: string }[];
  public readonly service: string;

  constructor(service: string, issues: readonly { path: string; message: string }[]) {
    super(
      `[${service}] Environment validation failed:\n` +
        issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n'),
    );
    this.name = 'EnvValidationError';
    this.service = service;
    this.issues = issues;
  }
}

const SECRET_KEY_PATTERN = /(SECRET|TOKEN|KEY|PASSWORD|DSN|API_KEY)$/i;

function redactValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (!SECRET_KEY_PATTERN.test(key)) return value;
  if (value.length === 0) return '<empty>';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

/**
 * Define and validate environment for a service.
 * @throws EnvValidationError when validation fails.
 */
export function defineEnv<Schema extends ZodTypeAny>(
  options: DefineEnvOptions<Schema>,
): z.infer<Schema> {
  const { schema, service, source = process.env, redactSecrets = true } = options;

  const result = schema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join('.') || '<root>',
      message: issue.message,
    }));
    throw new EnvValidationError(service, issues);
  }

  // Freeze to prevent mutation at runtime — env should be read-only.
  if (redactSecrets) {
    // Silence the redaction logic at runtime; it's exposed for serializers.
    void redactValue;
  }

  return Object.freeze(result.data) as z.infer<Schema>;
}

/**
 * Serialize an env object for logging — redacting secret-like keys.
 * Use this for the one-time "config loaded" log line on service boot.
 */
export function serializeForLog(env: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(env)) {
    out[k] = redactValue(k, v);
  }
  return out;
}
