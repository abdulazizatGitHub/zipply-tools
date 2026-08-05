import { describe, it, expect } from 'vitest';

import { createLogger } from './logger.js';

describe('createLogger', () => {
  it('returns a logger with the standard level methods', () => {
    const logger = createLogger({
      service: 'test',
      env: 'local',
      level: 'debug',
      pretty: false,
    });
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.child).toBe('function');
    expect(logger.level).toBe('debug');
  });

  it('supports child loggers', () => {
    const logger = createLogger({ service: 'test', env: 'local', pretty: false });
    const child = logger.child({ requestId: 'abc' });
    expect(typeof child.info).toBe('function');
  });
});
