/**
 * Auth preHandler.
 *
 * Responsibility: extract who is making the request and attach a `Principal`
 * to every request object before proxy routes run.
 *
 * Phase 2 policy:
 *   - Bearer token present → call identity service. Falls back to anonymous
 *     in dev when identity is not yet deployed.
 *   - x-api-key header present → same path.
 *   - No credentials → anonymous free-tier principal (pdf-merge is free;
 *     authenticated features are gated at the tool / entitlement layer).
 *
 * Production hardening (post M2): flip ALLOW_ANONYMOUS to false for any
 * route that requires authentication, and remove the dev fallback.
 */

import { HttpAuthClient, MemoryAuthClient, type Principal } from '@toolforge/auth-client';
import { createLogger } from '@toolforge/telemetry';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '../env.js';

// Augment Fastify's request type so downstream handlers are fully typed.
declare module 'fastify' {
  interface FastifyRequest {
    /** Resolved principal for this request. Null only when no auth was provided
     *  AND the route permits anonymous access. */
    principal: Principal | null;
  }
}

const logger = createLogger({ service: 'api-gateway' });

// Anonymous principal for unauthenticated free-tier requests.
// expiresAt is computed fresh per-process boot — fine for a dev/free-tier stub.
function anonPrincipal(): Principal {
  return {
    id: 'anon',
    kind: 'user',
    orgId: 'anon',
    plan: 'free',
    roles: [],
    locale: 'en',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Build the auth client once at startup. When identity is not configured
// (Phase 2 dev), fall back to a MemoryAuthClient that always rejects — the
// catch in resolveAuthHeader then falls through to anonymous.
const authClient: HttpAuthClient | MemoryAuthClient = env.IDENTITY_BASE_URL
  ? new HttpAuthClient({ baseUrl: env.IDENTITY_BASE_URL })
  : new MemoryAuthClient();

/**
 * Extract and verify credentials from the request. Returns the verified
 * principal, or null if no credentials were presented.
 *
 * Throws only on malformed credential format (not on identity service errors
 * in dev — those are caught and logged).
 */
async function resolveCredentials(request: FastifyRequest): Promise<Principal | null> {
  const authHeader = request.headers.authorization;
  const apiKey = request.headers['x-api-key'];

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      return await authClient.verifySession(token);
    } catch (err) {
      if (env.NODE_ENV === 'development') {
        logger.debug({ err }, 'identity verify failed in dev — falling back to anonymous');
        return null;
      }
      // In staging/production: propagate so the route returns 401.
      throw err;
    }
  }

  if (typeof apiKey === 'string' && apiKey.length > 0) {
    try {
      return await authClient.verifyApiKey(apiKey);
    } catch (err) {
      if (env.NODE_ENV === 'development') {
        logger.debug({ err }, 'api key verify failed in dev — falling back to anonymous');
        return null;
      }
      throw err;
    }
  }

  return null;
}

/**
 * Fastify preHandler that resolves the principal and attaches it to the
 * request. Routes that require authentication should check `request.principal`
 * and return 401 if null.
 *
 * Free-tier tools (like pdf-merge in Phase 2) allow null → anonymous.
 */
export async function authPreHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const principal = await resolveCredentials(request);
    request.principal = principal ?? anonPrincipal();
  } catch {
    void reply.status(401).send({
      type: 'https://errors.toolforge.dev/auth.invalid_credentials',
      title: 'Unauthorized',
      status: 401,
      detail: 'Invalid or expired credentials.',
      code: 'auth.invalid_credentials',
      retryable: false,
      traceId: request.id,
    });
  }
}
