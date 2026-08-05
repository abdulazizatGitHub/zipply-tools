/**
 * Tool handler — the executable half of the contract.
 *
 * Tools return one of:
 *   - { kind: 'sync',  output }      finished synchronously
 *   - { kind: 'async', jobId }       enqueued; client polls or receives webhook
 *   - { kind: 'error', error }       structured failure (PlatformError)
 *
 * Throwing inside a handler is permitted but discouraged — the runtime will
 * catch and convert to { kind: 'error' }. Returning is preferred for control flow.
 */

import type { PlatformError } from '@toolforge/errors';

import type { ToolContext } from './context.js';

export type ToolResult<O> =
  | { kind: 'sync'; output: O }
  | { kind: 'async'; jobId: string }
  | { kind: 'error'; error: PlatformError };

export interface ToolHandler<I = unknown, O = unknown> {
  execute(input: I, ctx: ToolContext): Promise<ToolResult<O>>;
}
