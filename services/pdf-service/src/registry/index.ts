/**
 * Tool registry.
 *
 * Holds the in-process set of `DefinedTool`s and builds the per-invocation
 * `ToolContext` from request data + injected platform services. Every tool
 * the service exposes is registered exactly once at boot.
 *
 * The registry is intentionally trivial — there is no dynamic loading,
 * no remote registration, no plugin discovery. Tools are TypeScript modules
 * compiled into the service. That is the whole point of the Tool Contract:
 * one process, one set of typed tools, no surprises.
 */

import { randomUUID } from 'node:crypto';

import { currentTraceId } from '@toolforge/telemetry';
import {
  type AIClient,
  type DefinedTool,
  type MeteringClient,
  type NotificationsClient,
  type ToolContext,
  type ToolManifest,
  type ToolResult,
} from '@toolforge/tool-contract';

import type { InMemoryFilesClient } from './files-memory.js';
import type { Logger } from '@toolforge/telemetry';

export interface RegistryPlatformServices {
  files: InMemoryFilesClient;
  ai: AIClient;
  metering: MeteringClient;
  notifications: NotificationsClient;
  logger: Logger;
}

export interface BuildContextInput {
  toolId: string;
  toolVersion: string;
  locale?: string;
  requestId?: string;
  signal: AbortSignal;
}

export class ToolRegistry {
  private readonly tools = new Map<string, DefinedTool>();

  constructor(private readonly platform: RegistryPlatformServices) {}

  register(tool: DefinedTool): void {
    if (this.tools.has(tool.manifest.id)) {
      throw new Error(`duplicate tool id: ${tool.manifest.id}`);
    }
    this.tools.set(tool.manifest.id, tool);
  }

  get(toolId: string): DefinedTool | undefined {
    return this.tools.get(toolId);
  }

  list(): ToolManifest[] {
    return [...this.tools.values()].map((t) => t.manifest);
  }

  /**
   * Resolve a tool, validate its input, build a ToolContext, and dispatch.
   * Returns the tool's ToolResult unchanged — the caller is responsible for
   * HTTP-encoding it.
   */
  async execute(input: {
    toolId: string;
    rawInput: unknown;
    locale?: string;
    requestId?: string;
    signal: AbortSignal;
  }): Promise<ToolResult<unknown>> {
    const tool = this.tools.get(input.toolId);
    if (!tool) throw new ToolNotFoundError(input.toolId);

    const parsed = tool.inputSchema.safeParse(input.rawInput);
    if (!parsed.success) {
      throw new ToolInputValidationError(input.toolId, parsed.error.flatten());
    }

    const ctx = this.buildContext({
      toolId: input.toolId,
      toolVersion: tool.manifest.version,
      ...(input.locale !== undefined && { locale: input.locale }),
      ...(input.requestId !== undefined && { requestId: input.requestId }),
      signal: input.signal,
    });

    return tool.handler.execute(parsed.data, ctx);
  }

  private buildContext(input: BuildContextInput): ToolContext {
    const requestId = input.requestId ?? randomUUID();
    const traceId = currentTraceId() ?? requestId;
    return {
      requestId,
      traceId,
      // Foundation-phase: anonymous synthetic user. Phase 2 swaps in the
      // verified Principal from api-gateway via request headers.
      user: { id: 'usr_anonymous', orgId: 'org_anonymous', plan: 'free' },
      locale: input.locale ?? 'en',
      toolId: input.toolId,
      toolVersion: input.toolVersion,
      files: this.platform.files,
      ai: this.platform.ai,
      metering: this.platform.metering,
      notifications: this.platform.notifications,
      logger: this.platform.logger.child({
        toolId: input.toolId,
        requestId,
      }),
      signal: input.signal,
    };
  }
}

// Errors -------------------------------------------------------------------

export class ToolNotFoundError extends Error {
  constructor(public readonly toolId: string) {
    super(`tool not found: ${toolId}`);
    this.name = 'ToolNotFoundError';
  }
}

export class ToolInputValidationError extends Error {
  constructor(
    public readonly toolId: string,
    public readonly flatten: unknown,
  ) {
    super(`invalid input for tool ${toolId}`);
    this.name = 'ToolInputValidationError';
  }
}
