import type { FastifyInstance } from 'fastify';

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get('/healthz', { logLevel: 'warn' }, () => ({ status: 'ok' }));
  app.get('/readyz', { logLevel: 'warn' }, () => ({ status: 'ready' }));
}
