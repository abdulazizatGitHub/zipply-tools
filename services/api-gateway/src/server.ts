import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { createLogger } from '@toolforge/telemetry';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';

import { env } from './env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerProxyRoutes } from './routes/proxy.js';

const logger = createLogger({ service: 'api-gateway' });

/**
 * Build and return a configured Fastify instance. Returning unstarted
 * lets tests construct without binding a port.
 */
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
    requestIdHeader: 'x-toolforge-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    // Trust proxy headers from Cloudflare; clamp to one hop.
    trustProxy: 1,
    bodyLimit: 5 * 1024 * 1024,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: false,
        useDefaults: true,
      },
    },
  });

  await app.register(sensible);
  await app.register(helmet, {
    // Cloudflare handles HSTS at the edge; keep CSP permissive at the API
    // layer (it's not serving HTML).
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow same-origin and well-known browser cases (no Origin header).
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

  // Initialise the principal decoration so rate-limit's keyGenerator can
  // read it safely. authPreHandler populates it per-request on proxy routes.
  app.decorateRequest('principal', null);

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIMEWINDOW_MS,
    hook: 'onRequest',
    // Key by principal ID when authenticated; fall back to IP for anonymous
    // and for health/readyz which skip the auth preHandler.
    keyGenerator: (request) =>
      (request.principal?.id !== 'anon' ? request.principal?.id : undefined) ?? request.ip,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  // Normalize errors into a ProblemDetails-like envelope so SDK and internal
  // clients can parse them uniformly.
  app.setErrorHandler((err: FastifyError, request, reply) => {
    const status = err.statusCode ?? 500;
    request.log.error({ err }, 'request failed');
    void reply.status(status).send({
      type: `https://errors.toolforge.example/${err.code || 'internal'}`,
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
      type: 'https://errors.toolforge.example/not_found',
      title: 'Not Found',
      status: 404,
      detail: `Route ${request.method} ${request.url} does not exist.`,
      code: 'not_found',
      retryable: false,
      traceId: request.id,
    });
  });

  // Fastify parameterises on the pino Logger type when loggerInstance is
  // passed. Route-registration helpers are typed against FastifyBaseLogger
  // (the default). The cast is safe — both types describe the same runtime.
  const untyped = app as unknown as FastifyInstance;
  registerHealthRoutes(untyped);
  registerProxyRoutes(untyped);

  return untyped;
}
