/**
 * @toolforge/test-utils
 *
 * Shared test fixtures and fakes. Save every package from re-inventing
 * Principal/Subscription/FileMeta factories.
 *
 * Convention: every builder accepts a partial override so tests can be
 * specific about what they care about without restating defaults.
 */

import type { Principal } from '@toolforge/auth-client';
import { MemoryAuthClient } from '@toolforge/auth-client';
import type { Subscription, Quota } from '@toolforge/billing-client';
import type { FileMeta } from '@toolforge/files-client';
import { NoopMeteringClient } from '@toolforge/metering-client';

export { MemoryAuthClient, NoopMeteringClient };

export function makePrincipal(overrides: Partial<Principal> = {}): Principal {
  return {
    id: 'usr_test_principal',
    kind: 'user',
    orgId: 'org_test',
    plan: 'pro',
    roles: ['member'],
    locale: 'en',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

export function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  const now = Date.now();
  return {
    id: 'sub_test',
    orgId: 'org_test',
    plan: 'pro',
    status: 'active',
    currentPeriodStart: new Date(now - 24 * 3600 * 1000).toISOString(),
    currentPeriodEnd: new Date(now + 30 * 24 * 3600 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

export function makeQuota(overrides: Partial<Quota> = {}): Quota {
  return {
    feature: 'pdf.merge.monthly',
    used: 0,
    limit: 1000,
    resetsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    ...overrides,
  };
}

export function makeFileMeta(overrides: Partial<FileMeta> = {}): FileMeta {
  return {
    id: 'file_test',
    ownerOrgId: 'org_test',
    toolId: 'pdf-merge',
    contentType: 'application/pdf',
    sizeBytes: 1024,
    scanStatus: 'clean',
    visibility: 'private',
    createdAt: new Date().toISOString(),
    retainUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Fixed-time provider for deterministic tests.
 *   const clock = makeClock('2026-01-01T00:00:00Z');
 *   clock.advance(5_000); // 5 seconds forward
 *   clock.now(); // -> Date
 */
export function makeClock(start: string | Date = new Date()) {
  let t = typeof start === 'string' ? new Date(start).getTime() : start.getTime();
  return {
    now(): Date {
      return new Date(t);
    },
    iso(): string {
      return new Date(t).toISOString();
    },
    advance(ms: number): void {
      t += ms;
    },
    set(value: string | Date): void {
      t = typeof value === 'string' ? new Date(value).getTime() : value.getTime();
    },
  };
}
