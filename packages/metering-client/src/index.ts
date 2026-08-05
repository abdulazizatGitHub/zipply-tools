/**
 * @toolforge/metering-client
 *
 * Fire-and-forget usage event emission with batching, retry, and
 * degrade-safe semantics.
 *
 * Design intent:
 *   - Tools call `record(event)` — synchronous, non-blocking. Returns void.
 *   - Events are buffered in-memory and flushed by interval or by
 *     size threshold, whichever comes first.
 *   - On flush failure the buffer is retained (bounded) and retried.
 *   - On buffer overflow oldest events are dropped with a counter increment.
 *   - On process shutdown, `flush()` is called; deploy/runtime layer must
 *     await it.
 *
 * Why this matters: tools must never have their latency or correctness
 * coupled to the metering pipeline. A metering outage cannot take down a
 * PDF merge. Billing accuracy at the long tail is enforced server-side by
 * idempotency keys, not by client perfection.
 */

import { HttpClient, type HttpClientOptions } from '@toolforge/platform-client';
import { createLogger, type Logger } from '@toolforge/telemetry';
import { z } from 'zod';

export const UsageEventSchema = z.object({
  /** Required identifier — server uses this for dedup. */
  id: z.string().min(1),
  /** ISO timestamp when the event occurred (NOT when buffered). */
  occurredAt: z.string().datetime(),
  /** Tool that emitted the event. */
  toolId: z.string().min(1),
  /** Org being billed; required for all billable events. */
  orgId: z.string().min(1),
  /** Principal whose action triggered the event. */
  principalId: z.string().min(1).optional(),
  /** Feature key for entitlement/quota correlation. */
  feature: z.string().min(1),
  /** Quantitative units (pages, bytes, tokens). */
  units: z.number().nonnegative(),
  /** Free-form attributes for analytics. Capped server-side. */
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;

export interface MeteringClientOptions extends Omit<HttpClientOptions, 'serviceName'> {
  serviceName?: string;
  /** Flush at most every N ms. Default 5_000. */
  flushIntervalMs?: number;
  /** Flush when buffer reaches N events. Default 100. */
  flushBatchSize?: number;
  /** Hard cap on buffered events. Default 10_000. */
  maxBufferSize?: number;
  logger?: Logger;
}

export interface MeteringClient {
  /** Buffer an event for delivery. Never throws on validation — logs and drops. */
  record(event: UsageEvent): void;
  /** Force a flush. Call on shutdown. */
  flush(signal?: AbortSignal): Promise<void>;
  /** Stop the periodic flusher and flush once. Call at process exit. */
  shutdown(): Promise<void>;
  /** Diagnostic — for tests and observability. */
  stats(): {
    buffered: number;
    sent: number;
    dropped: number;
    failedFlushes: number;
  };
}

export class HttpMeteringClient extends HttpClient implements MeteringClient {
  private readonly buffer: UsageEvent[] = [];
  private readonly flushIntervalMs: number;
  private readonly flushBatchSize: number;
  private readonly maxBufferSize: number;
  private readonly logger: Logger;
  private timer: NodeJS.Timeout | null = null;
  private flushing = false;
  private statsSent = 0;
  private statsDropped = 0;
  private statsFailed = 0;
  private stopped = false;

  constructor(options: MeteringClientOptions) {
    super({
      ...options,
      serviceName: options.serviceName ?? 'metering-client',
      // Metering inherits aggressive but bounded retry from base.
      retry: {
        maxAttempts: 4,
        baseDelayMs: 200,
        maxDelayMs: 5_000,
        retryStatuses: [429, 500, 502, 503, 504],
        ...options.retry,
      },
    });
    this.flushIntervalMs = options.flushIntervalMs ?? 5_000;
    this.flushBatchSize = options.flushBatchSize ?? 100;
    this.maxBufferSize = options.maxBufferSize ?? 10_000;
    this.logger = options.logger ?? createLogger({ service: 'metering-client' });
    this.startTimer();
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      void this.flush().catch(() => undefined);
    }, this.flushIntervalMs);
    // Don't keep the event loop alive for metering alone.
    this.timer.unref();
  }

  record(event: UsageEvent): void {
    if (this.stopped) {
      this.statsDropped += 1;
      return;
    }
    const parsed = UsageEventSchema.safeParse(event);
    if (!parsed.success) {
      this.logger.warn(
        { issues: parsed.error.flatten().fieldErrors },
        'metering: dropping invalid event',
      );
      this.statsDropped += 1;
      return;
    }
    if (this.buffer.length >= this.maxBufferSize) {
      this.buffer.shift();
      this.statsDropped += 1;
    }
    this.buffer.push(parsed.data);
    if (this.buffer.length >= this.flushBatchSize) {
      void this.flush().catch(() => undefined);
    }
  }

  async flush(signal?: AbortSignal): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;
    this.flushing = true;
    // Drain a snapshot so concurrent records don't grow the in-flight batch.
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      await this.post<undefined>('/v1/events:bulk', {
        body: { events: batch },
        idempotent: true,
        ...(signal ? { signal } : {}),
      });
      this.statsSent += batch.length;
    } catch (err) {
      this.statsFailed += 1;
      // Re-queue at the head — preserve order. Trim if we overflow.
      this.buffer.unshift(...batch);
      while (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift();
        this.statsDropped += 1;
      }
      this.logger.error(
        { err, batchSize: batch.length, buffered: this.buffer.length },
        'metering: flush failed; events re-queued',
      );
    } finally {
      this.flushing = false;
    }
  }

  async shutdown(): Promise<void> {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }

  stats(): {
    buffered: number;
    sent: number;
    dropped: number;
    failedFlushes: number;
  } {
    return {
      buffered: this.buffer.length,
      sent: this.statsSent,
      dropped: this.statsDropped,
      failedFlushes: this.statsFailed,
    };
  }
}

/** No-op implementation. Useful for unit tests of tool handlers. */
export class NoopMeteringClient implements MeteringClient {
  record(): void {
    /* noop */
  }
  async flush(): Promise<void> {
    /* noop */
  }
  async shutdown(): Promise<void> {
    /* noop */
  }
  stats(): {
    buffered: number;
    sent: number;
    dropped: number;
    failedFlushes: number;
  } {
    return { buffered: 0, sent: 0, dropped: 0, failedFlushes: 0 };
  }
}
