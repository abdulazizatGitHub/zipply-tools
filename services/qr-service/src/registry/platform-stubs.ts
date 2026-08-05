import type { AIClient, MeteringClient, NotificationsClient } from '@toolforge/tool-contract';

export const noopAi: AIClient = {
  complete() {
    return Promise.reject(new Error('ai-gateway not yet deployed'));
  },
};

export const noopMetering: MeteringClient = {
  record(): void {
    /* no-op until M4 */
  },
};

export const noopNotifications: NotificationsClient = {
  send(): Promise<void> {
    return Promise.resolve();
  },
};
