/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */
/**
 * api-gateway entrypoint.
 *
 * Boot order is significant:
 *   1. instrumentation.ts (loaded via -r before this file via the dev/start
 *      scripts) starts OTel
 *   2. env.ts validates configuration on first import
 *   3. buildServer() composes Fastify with plugins and routes
 *   4. listen() binds the port
 *   5. SIGTERM/SIGINT trigger graceful shutdown
 */

import { createLogger } from '@toolforge/telemetry';

import { env } from './env.js';
import { buildServer } from './server.js';

const logger = createLogger({ service: 'api-gateway' });

async function main(): Promise<void> {
  logger.info({ env: { NODE_ENV: env.NODE_ENV, PORT: env.PORT } }, 'starting');

  const app = await buildServer();
  await app.listen({ host: env.HOST, port: env.PORT });

  // Graceful shutdown — drain in-flight, stop accepting, close pools.
  // 25s budget aligns with Fly.io's default kill grace; tune in deploy
  // config if a different orchestrator caps lower.
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
