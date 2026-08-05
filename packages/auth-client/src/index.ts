/**
 * @toolforge/auth-client
 *
 * Typed client for the identity service. The ONLY legal way for any other
 * service or tool to verify sessions, resolve principals, or check
 * entitlements.
 *
 * Foundation phase: contract and types only. The backing identity service
 * is built in Phase 2. Until then, callers can wire `MemoryAuthClient`
 * (exported for tests) or stand the real client up against any compatible
 * upstream (Clerk-shaped, Ory-shaped, etc.).
 *
 * Contract stability: this package is a vendor boundary. When we migrate
 * the identity store (Clerk -> self-hosted Ory), THIS file does not change.
 */

import { HttpClient, type HttpClientOptions } from '@toolforge/platform-client';
import { z } from 'zod';

export type PrincipalKind = 'user' | 'api_key' | 'service';

export const PrincipalSchema = z.object({
  /** Stable identifier — never reused even after deletion. */
  id: z.string().min(1),
  kind: z.enum(['user', 'api_key', 'service']),
  /** Organization the principal acts within for this request. */
  orgId: z.string().min(1),
  /** Plan tier resolved at session time. Drives entitlement checks. */
  plan: z.enum(['free', 'pro', 'business', 'enterprise']),
  /** Roles granted in this org. Empty array for guest-equivalent. */
  roles: z.array(z.string()).default([]),
  /** Locale preference (BCP-47). UI defaults to this; SEO uses URL locale. */
  locale: z.string().min(2).default('en'),
  /** ISO timestamp — when this session token expires. */
  expiresAt: z.string().datetime(),
});

export type Principal = z.infer<typeof PrincipalSchema>;

export const EntitlementCheckSchema = z.object({
  feature: z.string().min(1),
  allowed: z.boolean(),
  /** Optional human-readable reason if not allowed. */
  reason: z.string().optional(),
  /** Optional upsell target plan. */
  requiresPlan: z.enum(['pro', 'business', 'enterprise']).optional(),
});

export type EntitlementCheck = z.infer<typeof EntitlementCheckSchema>;

export interface AuthClientOptions extends Omit<HttpClientOptions, 'serviceName'> {
  serviceName?: string;
}

/**
 * Contract for any auth client implementation. Use this type when injecting
 * into services so tests can supply a fake without depending on HTTP.
 */
export interface AuthClient {
  /** Verify a session token and return the principal. Throws on invalid. */
  verifySession(token: string, signal?: AbortSignal): Promise<Principal>;

  /** Verify an API key and return the principal. */
  verifyApiKey(key: string, signal?: AbortSignal): Promise<Principal>;

  /** Check entitlement for the principal against a feature flag/limit. */
  checkEntitlement(
    principalId: string,
    feature: string,
    signal?: AbortSignal,
  ): Promise<EntitlementCheck>;
}

/**
 * HTTP implementation against the identity service.
 * Construct one per process at boot; reuse across requests.
 */
export class HttpAuthClient extends HttpClient implements AuthClient {
  constructor(options: AuthClientOptions) {
    super({ ...options, serviceName: options.serviceName ?? 'auth-client' });
  }

  async verifySession(token: string, signal?: AbortSignal): Promise<Principal> {
    const raw = await this.post<unknown>('/v1/sessions/verify', {
      body: { token },
      idempotent: true,
      ...(signal ? { signal } : {}),
    });
    return PrincipalSchema.parse(raw);
  }

  async verifyApiKey(key: string, signal?: AbortSignal): Promise<Principal> {
    const raw = await this.post<unknown>('/v1/api-keys/verify', {
      body: { key },
      idempotent: true,
      ...(signal ? { signal } : {}),
    });
    return PrincipalSchema.parse(raw);
  }

  async checkEntitlement(
    principalId: string,
    feature: string,
    signal?: AbortSignal,
  ): Promise<EntitlementCheck> {
    const raw = await this.get<unknown>(
      `/v1/principals/${encodeURIComponent(principalId)}/entitlements/${encodeURIComponent(feature)}`,
      signal ? { signal } : {},
    );
    return EntitlementCheckSchema.parse(raw);
  }
}

/** In-memory implementation for tests. Never use in production. */
export class MemoryAuthClient implements AuthClient {
  private readonly sessions = new Map<string, Principal>();
  private readonly apiKeys = new Map<string, Principal>();

  registerSession(token: string, principal: Principal): void {
    this.sessions.set(token, principal);
  }

  registerApiKey(key: string, principal: Principal): void {
    this.apiKeys.set(key, principal);
  }

  verifySession(token: string): Promise<Principal> {
    const p = this.sessions.get(token);
    if (!p) return Promise.reject(new Error('invalid_session'));
    return Promise.resolve(p);
  }

  verifyApiKey(key: string): Promise<Principal> {
    const p = this.apiKeys.get(key);
    if (!p) return Promise.reject(new Error('invalid_api_key'));
    return Promise.resolve(p);
  }

  checkEntitlement(_principalId: string, feature: string): Promise<EntitlementCheck> {
    return Promise.resolve({ feature, allowed: true });
  }
}
