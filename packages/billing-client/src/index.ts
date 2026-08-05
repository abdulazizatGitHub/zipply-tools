/**
 * @toolforge/billing-client
 *
 * Typed client for the billing service. Subscriptions, plans, entitlements,
 * invoices, customer portals. Wraps Stripe through our boundary — Stripe SDKs
 * are never imported anywhere except inside the `billing` service itself.
 *
 * Why this matters: when (not if) we migrate or augment Stripe — Paddle for
 * VAT-heavy regions, manual enterprise invoicing — only the billing service
 * changes. Tools and other services keep calling the same client.
 */

import { HttpClient, type HttpClientOptions } from '@toolforge/platform-client';
import { z } from 'zod';

export const PlanTierSchema = z.enum(['free', 'pro', 'business', 'enterprise']);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const SubscriptionStatusSchema = z.enum([
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  plan: PlanTierSchema,
  status: SubscriptionStatusSchema,
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean(),
  /** Stripe customer ID — opaque to callers, used internally for portal links. */
  externalCustomerRef: z.string().optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export const QuotaSchema = z.object({
  feature: z.string().min(1),
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative().nullable(),
  /** ISO timestamp when the quota window resets. Null = lifetime quota. */
  resetsAt: z.string().datetime().nullable(),
});

export type Quota = z.infer<typeof QuotaSchema>;

export interface BillingClientOptions extends Omit<HttpClientOptions, 'serviceName'> {
  serviceName?: string;
}

export interface BillingClient {
  getSubscription(orgId: string, signal?: AbortSignal): Promise<Subscription>;
  getQuota(orgId: string, feature: string, signal?: AbortSignal): Promise<Quota>;
  /**
   * Returns a one-shot URL the user can be redirected to for portal access.
   * URL TTL is server-decided; do not cache.
   */
  createPortalSession(
    orgId: string,
    returnUrl: string,
    signal?: AbortSignal,
  ): Promise<{ url: string }>;
}

export class HttpBillingClient extends HttpClient implements BillingClient {
  constructor(options: BillingClientOptions) {
    super({ ...options, serviceName: options.serviceName ?? 'billing-client' });
  }

  async getSubscription(orgId: string, signal?: AbortSignal): Promise<Subscription> {
    const raw = await this.get<unknown>(
      `/v1/orgs/${encodeURIComponent(orgId)}/subscription`,
      signal ? { signal } : {},
    );
    return SubscriptionSchema.parse(raw);
  }

  async getQuota(orgId: string, feature: string, signal?: AbortSignal): Promise<Quota> {
    const raw = await this.get<unknown>(
      `/v1/orgs/${encodeURIComponent(orgId)}/quotas/${encodeURIComponent(feature)}`,
      signal ? { signal } : {},
    );
    return QuotaSchema.parse(raw);
  }

  async createPortalSession(
    orgId: string,
    returnUrl: string,
    signal?: AbortSignal,
  ): Promise<{ url: string }> {
    return this.post<{ url: string }>(`/v1/orgs/${encodeURIComponent(orgId)}/portal-sessions`, {
      body: { returnUrl },
      ...(signal ? { signal } : {}),
    });
  }
}
