import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { createLogger } from '@toolforge/telemetry';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';

import { env } from './env.js';
import { InMemoryFilesClient } from './registry/files-memory.js';
import { ToolRegistry } from './registry/index.js';
import { noopAi, noopMetering, noopNotifications } from './registry/platform-stubs.js';
import { registerDevUploadRoutes } from './routes/dev-upload.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerToolRoutes } from './routes/tools.js';
import { allTools } from './tools/index.js';

const logger = createLogger({ service: 'pdf-service', env: env.NODE_ENV });

/**
 * Build and return a configured Fastify instance + the registry it serves.
 * Returning unstarted lets tests construct without binding a port.
 */
export async function buildServer(): Promise<{
  app: FastifyInstance;
  registry: ToolRegistry;
}> {
  const app = Fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
    requestIdHeader: 'x-toolforge-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    trustProxy: 1,
    // Larger limit because tool execute bodies can carry inline metadata;
    // raw file bytes go through the dev upload route, not JSON bodies.
    bodyLimit: 2 * 1024 * 1024,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: false,
        useDefaults: true,
      },
    },
  });

  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (env.NODE_ENV === 'development' && env.CORS_ALLOWED_ORIGINS.length === 0) {
        cb(null, true);
        return;
      }
      cb(null, env.CORS_ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
    maxAge: 600,
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIMEWINDOW_MS,
    hook: 'onRequest',
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  app.setErrorHandler((err: FastifyError, request, reply) => {
    const status = err.statusCode ?? 500;
    request.log.error({ err }, 'request failed');
    void reply.status(status).send({
      type: `https://errors.toolforge.dev/${err.code || 'internal'}`,
      title: err.name || 'Error',
      status,
      detail: err.message,
      code: err.code,
      retryable: status >= 500 && status < 600,
      traceId: request.id,
    });
  });

  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      type: 'https://errors.toolforge.dev/not_found',
      title: 'Not Found',
      status: 404,
      detail: `Route ${request.method} ${request.url} does not exist.`,
      code: 'not_found',
      retryable: false,
      traceId: request.id,
    });
  });

  // Build the registry and register every tool exported from src/tools/.
  const files = new InMemoryFilesClient();
  const registry = new ToolRegistry({
    files,
    ai: noopAi,
    metering: noopMetering,
    notifications: noopNotifications,
    logger,
  });
  for (const t of allTools) registry.register(t);

  // Same logger-type cast as api-gateway — see comment there.
  const untyped = app as unknown as FastifyInstance;
  registerHealthRoutes(untyped);
  registerToolRoutes(untyped, registry);
  if (env.ENABLE_DEV_UPLOAD_ROUTE) {
    registerDevUploadRoutes(untyped, files);
    logger.warn('dev upload route enabled at POST /v1/_dev/files — disable in staging/production');
  }

  return { app: untyped, registry };
}
