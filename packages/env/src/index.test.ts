import { describe, it, expect } from 'vitest';

import { defineEnv, EnvValidationError, serializeForLog, z } from './index.js';

describe('defineEnv', () => {
  it('parses and freezes valid env', () => {
    const env = defineEnv({
      service: 'test',
      schema: z.object({
        PORT: z.coerce.number().int(),
        NAME: z.string(),
      }),
      source: { PORT: '8080', NAME: 'alpha' },
    });
    expect(env.PORT).toBe(8080);
    expect(env.NAME).toBe('alpha');
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('throws EnvValidationError with structured issues', () => {
    expect(() =>
      defineEnv({
        service: 'test',
        schema: z.object({ PORT: z.coerce.number().int() }),
        source: { PORT: 'not-a-number' },
      }),
    ).toThrow(EnvValidationError);
  });
});

describe('serializeForLog', () => {
  it('redacts secret-like keys', () => {
    const out = serializeForLog({
      DATABASE_URL: 'postgres://x',
      STRIPE_SECRET_KEY: 'sk_test_abcd1234',
      LOG_LEVEL: 'info',
    });
    expect(out.LOG_LEVEL).toBe('info');
    expect(out.STRIPE_SECRET_KEY).toBe('sk***34');
    expect(out.DATABASE_URL).toBe('postgres://x');
  });
});
