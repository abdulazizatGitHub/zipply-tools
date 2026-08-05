import { describe, it, expect } from 'vitest';

import {
  InternalError,
  NotFoundError,
  RateLimitedError,
  toPlatformError,
  ValidationError,
  isPlatformError,
} from './index.js';

describe('PlatformError taxonomy', () => {
  it('NotFoundError has status 404 and stable code', () => {
    const e = new NotFoundError({ message: 'tool not found' });
    expect(e.status).toBe(404);
    expect(e.code).toBe('resource.not_found');
    expect(e.retryable).toBe(false);
  });

  it('RateLimitedError is retryable by default', () => {
    const e = new RateLimitedError({ message: 'too many' });
    expect(e.retryable).toBe(true);
  });

  it('ValidationError carries details', () => {
    const e = new ValidationError({
      message: 'bad input',
      details: { field: 'email' },
    });
    expect(e.details).toEqual({ field: 'email' });
  });

  it('serializes to ProblemDetails (RFC 7807) shape', () => {
    const e = new NotFoundError({ message: 'no tool' });
    const pd = e.toProblemDetails('trace-abc', '/v1/tools/x');
    expect(pd).toMatchObject({
      type: 'https://errors.toolforge.dev/resource.not_found',
      status: 404,
      code: 'resource.not_found',
      traceId: 'trace-abc',
      instance: '/v1/tools/x',
    });
  });
});

describe('toPlatformError', () => {
  it('passes through PlatformError instances', () => {
    const e = new ValidationError({ message: 'x' });
    expect(toPlatformError(e)).toBe(e);
  });
  it('wraps native Error as InternalError', () => {
    const e = toPlatformError(new Error('boom'));
    expect(e).toBeInstanceOf(InternalError);
    expect(e.message).toBe('boom');
  });
  it('wraps non-Error values', () => {
    const e = toPlatformError('not-an-error');
    expect(e).toBeInstanceOf(InternalError);
    expect(isPlatformError(e)).toBe(true);
  });
});
