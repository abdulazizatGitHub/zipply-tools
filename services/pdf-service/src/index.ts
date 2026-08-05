/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */
/**
 * pdf-service entrypoint.
 *
 * Boot order: OTel init → env validation → server build → listen → signals.
 * In production the OTel SDK is preloaded via `node -r ./dist/instrumentation.js`.
 * In dev (tsx watch) we skip the preload — auto-instrumentation is a nice-to-have
 * in local dev, not a correctness requirement.
 */

import { createLogger } from '@toolforge/telemetry';

import { env } from './env.js';
import { buildServer } from './server.js';

const logger = createLogger({ service: 'pdf-service', env: env.NODE_ENV });

async function main(): Promise<void> {
  logger.info({ env: { NODE_ENV: env.NODE_ENV, PORT: env.PORT } }, 'starting');

  const { app, registry } = await buildServer();
  await app.listen({ host: env.HOST, port: env.PORT });

  logger.info({ toolCount: registry.list().length, port: env.PORT }, 'pdf-service ready');

  // Graceful shutdown — 25s budget aligns with Fly.io's default kill grace.
  const SHUTDOWN_TIMEOUT_MS = 25_000;
  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.warn({ signal }, 'shutting down');
    const killer = setTimeout(() => {
      logger.fatal('shutdown timeout exceeded; forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    killer.unref();
    app
      .close()
      .then(() => {
        logger.info('closed cleanly');
        process.exit(0);
      })
      .catch((err: unknown) => {
        logger.error({ err }, 'error during close');
        process.exit(1);
      });
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaughtException');
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'unhandledRejection');
    shutdown('unhandledRejection');
  });
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'fatal during boot');
  process.exit(1);
});
