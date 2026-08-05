/**
 * Foundation-phase stubs for platform services the registry needs.
 *
 * These are deliberately minimal. The real implementations land at:
 *   - ai-client → services/ai-gateway     (Phase 2 — deferred)
 *   - metering-client → services/metering (M4)
 *   - notifications → services/notifications (deferred past Phase 2)
 *
 * Until then, tools that name these in `dependencies.platformServices` get a
 * no-op surface so the contract is honored at runtime.
 */

import type { AIClient, MeteringClient, NotificationsClient } from '@toolforge/tool-contract';

export const noopAi: AIClient = {
  complete() {
    return Promise.reject(new Error('ai-client: ai-gateway not yet deployed (Phase 2 deferred)'));
  },
};

export const noopMetering: MeteringClient = {
  record(): void {
    // intentional no-op — replaced by the real client at M4
  },
};

export const noopNotifications: NotificationsClient = {
  send(): Promise<void> {
    return Promise.resolve();
  },
};
