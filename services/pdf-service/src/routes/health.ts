import type { FastifyInstance } from 'fastify';

/**
 * Health & readiness — see services/api-gateway/src/routes/health.ts for
 * the canonical comment. Keep these endpoints separate.
 */
export function registerHealthRoutes(app: FastifyInstance): void {
  app.get('/healthz', { logLevel: 'warn' }, () => ({ status: 'ok' }));

  app.get('/readyz', { logLevel: 'warn' }, () => ({ status: 'ready' }));

  app.get('/whoami', (request) => ({
    service: 'pdf-service',
    requestId: request.id,
    now: new Date().toISOString(),
  }));
}
