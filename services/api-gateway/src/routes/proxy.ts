/**
 * Proxy routes — forward /v1/tools/** to the correct upstream service.
 *
 * Routing table:
 *   pdf-*   → pdf-service  (port 8081)
 *   qr-*    → qr-service   (port 8082)
 *
 * Before forwarding:
 *   - Strips Authorization / x-api-key (never leak to internals)
 *   - Injects x-toolforge-principal-id and x-toolforge-plan
 *   - Propagates request-id and OTel trace headers
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { authPreHandler } from '../auth/middleware.js';
import { env } from '../env.js';

// ── Service routing table ───────────────────────────────────────────────────
// Add new services here — toolId prefix → base URL.
const SERVICE_ROUTES: [prefix: string, baseUrl: () => string][] = [
  ['pdf-', () => env.PDF_SERVICE_URL],
  ['qr-', () => env.QR_SERVICE_URL],
];

function resolveUpstream(toolId: string): string {
  for (const [prefix, urlFn] of SERVICE_ROUTES) {
    if (toolId.startsWith(prefix)) return urlFn().replace(/\/$/, '');
  }
  // Default fallback to pdf-service so existing tools keep working
  return env.PDF_SERVICE_URL.replace(/\/$/, '');
}

// ── Header helpers ──────────────────────────────────────────────────────────
const STRIP_REQUEST_HEADERS = new Set([
  'authorization',
  'x-api-key',
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
]);

function buildUpstreamHeaders(request: FastifyRequest): Record<string, string> {
  const forwarded: Record<string, string> = {};
  for (const [key, val] of Object.entries(request.headers)) {
    if (STRIP_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    if (typeof val === 'string') forwarded[key] = val;
    else if (Array.isArray(val)) forwarded[key] = val.join(', ');
  }
  forwarded['x-toolforge-request-id'] = request.id;
  if (request.principal) {
    forwarded['x-toolforge-principal-id'] = request.principal.id;
    forwarded['x-toolforge-plan'] = request.principal.plan;
  }
  return forwarded;
}

async function proxyJson(
  upstreamUrl: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
  reply: FastifyReply,
): Promise<void> {
  const res = await fetch(upstreamUrl, {
    method,
    headers: { ...headers, 'content-type': 'application/json', accept: 'application/json' },
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });
  const responseBody = await res.json().catch(() => null);
  void reply.status(res.status).send(responseBody);
}

// ── Routes ──────────────────────────────────────────────────────────────────
export function registerProxyRoutes(app: FastifyInstance): void {
  // GET /v1/tools — aggregate manifests from all known services
  app.get(
    '/v1/tools',
    { preHandler: [authPreHandler] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const headers = buildUpstreamHeaders(request);
      const results = await Promise.allSettled(
        SERVICE_ROUTES.map(([, urlFn]) =>
          fetch(`${urlFn().replace(/\/$/, '')}/v1/tools`, {
            method: 'GET',
            headers: { ...headers, accept: 'application/json' },
          })
            .then((r) => r.json() as Promise<{ tools?: unknown[] }>)
            .then((d) => d.tools ?? []),
        ),
      );
      const tools = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
      void reply.send({ tools });
    },
  );

  // GET /v1/tools/:toolId — route to correct service
  app.get<{ Params: { toolId: string } }>(
    '/v1/tools/:toolId',
    { preHandler: [authPreHandler] },
    async (request, reply) => {
      const { toolId } = request.params;
      const base = resolveUpstream(toolId);
      await proxyJson(
        `${base}/v1/tools/${encodeURIComponent(toolId)}`,
        'GET',
        buildUpstreamHeaders(request),
        undefined,
        reply,
      );
    },
  );

  // POST /v1/tools/:toolId/execute — route to correct service
  app.post<{ Params: { toolId: string }; Body: unknown }>(
    '/v1/tools/:toolId/execute',
    { preHandler: [authPreHandler] },
    async (request, reply) => {
      const { toolId } = request.params;
      const base = resolveUpstream(toolId);
      await proxyJson(
        `${base}/v1/tools/${encodeURIComponent(toolId)}/execute`,
        'POST',
        buildUpstreamHeaders(request),
        request.body,
        reply,
      );
    },
  );
}
