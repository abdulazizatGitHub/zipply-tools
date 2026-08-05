import type { FastifyInstance } from 'fastify';

/**
 * Health & readiness — separated for a reason.
 *
 *   /healthz  — process is alive. Returns 200 once the server is listening.
 *               Used by container orchestrators for liveness probes.
 *   /readyz   — process can serve traffic. Returns 200 only when critical
 *               downstream deps (identity, etc.) are reachable. Used for
 *               readiness probes and load balancer drain.
 *
 * Health and readiness MUST NOT be the same endpoint. Conflating them is
 * the most common reason a healthy-looking pod still serves 503s.
 */
export function registerHealthRoutes(app: FastifyInstance): void {
  app.get('/healthz', { logLevel: 'warn' }, () => ({ status: 'ok' }));

  app.get('/readyz', { logLevel: 'warn' }, () => {
    // Phase 2: ping identity and other critical deps with a tight timeout.
    // For now: just confirm the process is up.
    return { status: 'ready' };
  });

  // Useful in dev to confirm the OTel header propagation chain.
  app.get('/whoami', (request) => ({
    service: 'api-gateway',
    requestId: request.id,
    now: new Date().toISOString(),
  }));
}
