/**
 * Platform service interfaces exposed to tools via ToolContext.
 *
 * These are interfaces, not implementations. The registry binds concrete
 * implementations at runtime. Tools depend only on the shapes here.
 *
 * Concrete clients (services/* and packages/*-client) implement these.
 * In tests, tools receive in-memory fakes that also implement them.
 */

import type { Logger } from '@toolforge/telemetry';

/**
 * Files client — single way tools read/write user-provided files.
 * No tool talks to R2/S3 directly. Ever.
 */
export interface FilesClient {
  /** Read a stored file's bytes as a stream. */
  readStream(fileId: string): Promise<ReadableStream<Uint8Array>>;
  /** Read a stored file's bytes as a buffer (use only for small files). */
  readBytes(fileId: string): Promise<Uint8Array>;
  /** Store output bytes, returning a fileId and a short-lived download URL. */
  write(input: {
    bytes: Uint8Array | ReadableStream<Uint8Array>;
    mimeType: string;
    filename?: string;
    retentionSeconds?: number;
  }): Promise<{ fileId: string; downloadUrl: string; expiresAt: string }>;
}

/**
 * AI client — single way tools invoke models. Routes through ai-gateway,
 * which handles caching, budget, vendor selection, and cost attribution.
 */
export interface AIClient {
  complete(input: {
    promptId: string; // a registered, versioned prompt — never raw strings
    variables: Record<string, string>;
    model?: 'fast' | 'balanced' | 'best'; // tier, not vendor
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number } }>;
}

/**
 * Metering client — emit usage events for billing/quota/analytics.
 * Fire-and-forget; do not await in latency-sensitive paths.
 */
export interface MeteringClient {
  record(event: {
    meterKey: string; // matches manifest.pricing.meterKey
    quantity: number;
    attributes?: Record<string, string | number | boolean>;
  }): void;
}

/**
 * Notifications client — outbound messages to users (email, in-app, webhook).
 */
export interface NotificationsClient {
  send(input: {
    template: string;
    to: { userId: string };
    variables: Record<string, string>;
  }): Promise<void>;
}

export type { Logger };
