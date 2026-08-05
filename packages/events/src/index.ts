/**
 * @toolforge/events
 *
 * Cross-service event schemas. Single source of truth for async message
 * shapes. Producers and consumers import the same schema so version drift
 * is a compile error, not a 3am incident.
 *
 * Versioning rule: events are versioned with `v1`, `v2` etc. as separate
 * exports. Never mutate a published schema. Breaking changes ship as a new
 * version and consumers migrate on their own schedule.
 *
 * Foundation phase ships the envelope shape and three canonical event
 * families: tool.* (job lifecycle), file.* (storage lifecycle),
 * billing.* (subscription lifecycle). More land with Phase 2 services.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Envelope — every event wears this jacket.
// ---------------------------------------------------------------------------

export const EnvelopeSchema = z.object({
  /** Unique event id. Consumers MUST dedup on this. */
  id: z.string().min(1),
  /** Fully qualified event name, e.g. "tool.job.completed.v1" */
  type: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+\.v\d+$/),
  /** ISO timestamp event was produced. */
  occurredAt: z.string().datetime(),
  /** Service that produced this event. */
  producer: z.string().min(1),
  /** Optional W3C trace id for cross-service correlation. */
  traceId: z.string().optional(),
  /** Schema version of the data payload. */
  dataVersion: z.literal(1).default(1),
  /** Payload — shape determined by `type`. */
  data: z.unknown(),
});

export type Envelope = z.infer<typeof EnvelopeSchema>;

// Helper to wrap a typed data schema with the envelope.
export function envelope<T extends z.ZodTypeAny>(dataSchema: T) {
  return EnvelopeSchema.extend({ data: dataSchema });
}

// ---------------------------------------------------------------------------
// tool.* — tool job lifecycle.
// ---------------------------------------------------------------------------

export const ToolJobStartedV1 = envelope(
  z.object({
    jobId: z.string().min(1),
    toolId: z.string().min(1),
    orgId: z.string().min(1),
    principalId: z.string().optional(),
    inputsSummary: z.object({
      fileCount: z.number().int().nonnegative(),
      totalBytes: z.number().int().nonnegative(),
    }),
  }),
);

export const ToolJobCompletedV1 = envelope(
  z.object({
    jobId: z.string().min(1),
    toolId: z.string().min(1),
    orgId: z.string().min(1),
    durationMs: z.number().int().nonnegative(),
    outputs: z.array(
      z.object({
        fileId: z.string().min(1),
        contentType: z.string(),
        sizeBytes: z.number().int().nonnegative(),
      }),
    ),
  }),
);

export const ToolJobFailedV1 = envelope(
  z.object({
    jobId: z.string().min(1),
    toolId: z.string().min(1),
    orgId: z.string().min(1),
    code: z.string().min(1),
    message: z.string(),
    durationMs: z.number().int().nonnegative(),
    retryable: z.boolean(),
  }),
);

// ---------------------------------------------------------------------------
// file.* — files service lifecycle.
// ---------------------------------------------------------------------------

export const FileUploadedV1 = envelope(
  z.object({
    fileId: z.string().min(1),
    orgId: z.string().min(1),
    contentType: z.string(),
    sizeBytes: z.number().int().nonnegative(),
  }),
);

export const FileScannedV1 = envelope(
  z.object({
    fileId: z.string().min(1),
    status: z.enum(['clean', 'infected', 'errored']),
  }),
);

export const FileDeletedV1 = envelope(
  z.object({
    fileId: z.string().min(1),
    reason: z.enum(['user', 'retention', 'admin', 'infected']),
  }),
);

// ---------------------------------------------------------------------------
// billing.* — subscription lifecycle.
// ---------------------------------------------------------------------------

export const SubscriptionChangedV1 = envelope(
  z.object({
    orgId: z.string().min(1),
    fromPlan: z.enum(['free', 'pro', 'business', 'enterprise']).nullable(),
    toPlan: z.enum(['free', 'pro', 'business', 'enterprise']),
    effectiveAt: z.string().datetime(),
  }),
);

// ---------------------------------------------------------------------------
// Registry — maps event types to their schemas. Used by consumers that
// dispatch on `type` and need a typed payload.
// ---------------------------------------------------------------------------

export const EVENT_REGISTRY = {
  'tool.job.started.v1': ToolJobStartedV1,
  'tool.job.completed.v1': ToolJobCompletedV1,
  'tool.job.failed.v1': ToolJobFailedV1,
  'file.uploaded.v1': FileUploadedV1,
  'file.scanned.v1': FileScannedV1,
  'file.deleted.v1': FileDeletedV1,
  'billing.subscription.changed.v1': SubscriptionChangedV1,
} as const;

export type EventType = keyof typeof EVENT_REGISTRY;

export type EventOf<T extends EventType> = z.infer<(typeof EVENT_REGISTRY)[T]>;

/** Parse an unknown event payload against the registry. */
export function parseEvent(raw: unknown): Envelope {
  const env = EnvelopeSchema.parse(raw);
  const schema = (EVENT_REGISTRY as Record<string, z.ZodTypeAny | undefined>)[env.type];
  if (!schema) {
    // Unknown type — keep envelope, leave data as unknown.
    return env;
  }
  return schema.parse(raw) as Envelope;
}
