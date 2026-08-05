/**
 * ToolContext — the per-invocation context every handler receives.
 *
 * The registry constructs and injects this. Tools never construct their own
 * context (would defeat the purpose of dependency injection and bypass auth).
 */

import type {
  AIClient,
  FilesClient,
  Logger,
  MeteringClient,
  NotificationsClient,
} from './platform-services.js';

export interface ToolUser {
  id: string;
  orgId: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface ToolContext {
  /** Stable request identifier propagated through downstream calls. */
  requestId: string;
  /** Current W3C trace id (also available via @toolforge/telemetry). */
  traceId: string;
  /** Authenticated user. Even anonymous traffic carries a synthetic user. */
  user: ToolUser;
  /** Active locale for this invocation. */
  locale: string;
  /** Tool id (resolved by the registry). */
  toolId: string;
  /** Tool version executed (resolved by the registry). */
  toolVersion: string;

  // Platform services -- injected, not imported.
  files: FilesClient;
  ai: AIClient;
  metering: MeteringClient;
  notifications: NotificationsClient;
  logger: Logger;

  /** Cancellation signal — abort processing if downstream cancels. */
  signal: AbortSignal;
}
