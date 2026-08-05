/**
 * defineTool — the canonical way to declare a tool with manifest + handler.
 *
 * Tools call this at module top-level. The registry imports the default export
 * to load the tool. Strong typing across the manifest, input schema, and
 * handler signature is the whole point.
 */

import type { z, ZodTypeAny } from 'zod';

import type { ToolContext } from './context.js';
import type { ToolHandler, ToolResult } from './handler.js';
import type { ToolManifest } from './manifest.js';

export interface DefineToolOptions<
  InputSchema extends ZodTypeAny,
  OutputSchema extends ZodTypeAny,
> {
  manifest: ToolManifest;
  /** Runtime-validated input schema. Drives UI generation and request validation. */
  input: InputSchema;
  /** Runtime-validated output schema. Drives result serialization. */
  output: OutputSchema;
  /** The execution function. */
  execute: (
    input: z.infer<InputSchema>,
    ctx: ToolContext,
  ) => Promise<ToolResult<z.infer<OutputSchema>>>;
}

export interface DefinedTool<
  InputSchema extends ZodTypeAny = ZodTypeAny,
  OutputSchema extends ZodTypeAny = ZodTypeAny,
> {
  manifest: ToolManifest;
  inputSchema: InputSchema;
  outputSchema: OutputSchema;
  handler: ToolHandler<z.infer<InputSchema>, z.infer<OutputSchema>>;
}

export function defineTool<InputSchema extends ZodTypeAny, OutputSchema extends ZodTypeAny>(
  options: DefineToolOptions<InputSchema, OutputSchema>,
): DefinedTool<InputSchema, OutputSchema> {
  return {
    manifest: options.manifest,
    inputSchema: options.input,
    outputSchema: options.output,
    handler: {
      execute: options.execute,
    },
  };
}
