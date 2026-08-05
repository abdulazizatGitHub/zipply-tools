/**
 * @toolforge/ai-client
 *
 * Typed client for the AI gateway. The ONLY way any tool calls a model.
 *
 * Foundation-phase design intent:
 *   - Tools reference *logical* model names ("summarize-short", "vision-fast"),
 *     not provider-specific ones ("gpt-4o-mini"). The gateway maps logical to
 *     physical per environment, with fallbacks.
 *   - All requests are budget-tagged (toolId, principalId, orgId) for
 *     attribution and per-tenant caps.
 *   - The gateway caches by a deterministic input hash where applicable;
 *     callers pass `cacheable: true` to opt in.
 *   - Streaming uses Server-Sent Events; non-streaming returns a single JSON.
 *
 * Direct OpenAI/Anthropic SDK imports are prohibited outside the
 * `ai-gateway` service. Enforced in ESLint (no-restricted-imports).
 */

import { HttpClient, type HttpClientOptions } from '@toolforge/platform-client';
import { z } from 'zod';

export const RoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);
export type Role = z.infer<typeof RoleSchema>;

export const ContentPartSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('image_ref'),
    /** Reference into the files service. Gateway resolves to bytes. */
    fileId: z.string().min(1),
  }),
]);
export type ContentPart = z.infer<typeof ContentPartSchema>;

export const MessageSchema = z.object({
  role: RoleSchema,
  content: z.union([z.string(), z.array(ContentPartSchema)]),
});
export type Message = z.infer<typeof MessageSchema>;

export const CompletionRequestSchema = z.object({
  /** Logical model id, NOT a vendor name. */
  model: z.string().min(1),
  messages: z.array(MessageSchema).min(1),
  /** Hard cap on output tokens. Gateway clamps to model-allowed max. */
  maxOutputTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  /** Stop sequences. */
  stop: z.array(z.string()).max(4).optional(),
  /** Caller hints — used for budgeting, caching, observability. */
  hints: z
    .object({
      toolId: z.string().min(1),
      cacheable: z.boolean().default(false),
      /** Hint: low|standard|high — drives model routing fallbacks. */
      priority: z.enum(['low', 'standard', 'high']).default('standard'),
      /** Idempotency key — same key short-circuits to cached output. */
      idempotencyKey: z.string().min(1).optional(),
    })
    .optional(),
});

export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;

export const TokenUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  /** Cents — gateway resolves at request time. */
  estimatedCostCents: z.number().nonnegative(),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const CompletionResponseSchema = z.object({
  id: z.string().min(1),
  /** Resolved physical model (for observability). */
  resolvedModel: z.string().min(1),
  output: z.string(),
  finishReason: z.enum(['stop', 'length', 'content_filter', 'error']),
  usage: TokenUsageSchema,
  cached: z.boolean(),
});

export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;

export interface AiClientOptions extends Omit<HttpClientOptions, 'serviceName'> {
  serviceName?: string;
}

export interface AiClient {
  complete(request: CompletionRequest, signal?: AbortSignal): Promise<CompletionResponse>;
  /**
   * Streamed completion. Yields incremental text deltas; the final value is
   * the full response with usage. Implementations MUST surface backpressure.
   */
  stream(
    request: CompletionRequest,
    signal?: AbortSignal,
  ): AsyncIterable<{ delta: string } | { done: CompletionResponse }>;
}

export class HttpAiClient extends HttpClient implements AiClient {
  constructor(options: AiClientOptions) {
    super({ ...options, serviceName: options.serviceName ?? 'ai-client' });
  }

  async complete(request: CompletionRequest, signal?: AbortSignal): Promise<CompletionResponse> {
    const validated = CompletionRequestSchema.parse(request);
    const raw = await this.post<unknown>('/v1/completions', {
      body: validated,
      // Idempotent if caller supplied an idempotency key.
      idempotent: Boolean(validated.hints?.idempotencyKey),
      ...(signal ? { signal } : {}),
    });
    return CompletionResponseSchema.parse(raw);
  }

  // Streaming wired in Phase 2 when the gateway exists. Foundation-phase
  // contract is here so callers can type against it now.
  // eslint-disable-next-line @typescript-eslint/require-await, require-yield
  async *stream(
    _request: CompletionRequest,
    _signal?: AbortSignal,
  ): AsyncIterable<{ delta: string } | { done: CompletionResponse }> {
    throw new Error('ai-client.stream: not implemented in foundation phase');
  }
}
