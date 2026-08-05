import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { createLogger } from '@toolforge/telemetry';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';

import { env } from './env.js';
import { NoopFilesClient } from './registry/files-noop.js';
import { noopAi, noopMetering, noopNotifications } from './registry/platform-stubs.js';
import { registerHealthRoutes } from './routes/health.js';
import { allTools } from './tools/index.js';

// Import ToolRegistry from the pdf-service pattern — each service owns its registry.
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
import { isPlatformError, toPlatformError } from '@toolforge/errors';
import { z } from 'zod';

/* ── Inline ToolRegistry (identical to pdf-service — extracted to shared pkg later) ── */

class ToolNotFoundError extends Error {
  constructor(public readonly toolId: string) {
    super(`tool not found: ${toolId}`);
    this.name = 'ToolNotFoundError';
  }
}
class ToolInputValidationError extends Error {
  constructor(
    public readonly toolId: string,
    public readonly flatten: unknown,
  ) {
    super(`invalid input for tool ${toolId}`);
    this.name = 'ToolInputValidationError';
  }
}

interface RegistryServices {
  files: NoopFilesClient;
  ai: AIClient;
  metering: MeteringClient;
  notifications: NotificationsClient;
  logger: ReturnType<typeof createLogger>;
}

class ToolRegistry {
  private readonly tools = new Map<string, DefinedTool>();
  constructor(private readonly platform: RegistryServices) {}

  register(tool: DefinedTool): void {
    if (this.tools.has(tool.manifest.id)) throw new Error(`duplicate tool id: ${tool.manifest.id}`);
    this.tools.set(tool.manifest.id, tool);
  }

  get(id: string): DefinedTool | undefined {
    return this.tools.get(id);
  }
  list(): ToolManifest[] {
    return [...this.tools.values()].map((t) => t.manifest);
  }

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
    if (!parsed.success) throw new ToolInputValidationError(input.toolId, parsed.error.flatten());
    const requestId = input.requestId ?? randomUUID();
    const traceId = currentTraceId() ?? requestId;
    const ctx: ToolContext = {
      requestId,
      traceId,
      user: { id: 'usr_anonymous', orgId: 'org_anonymous', plan: 'free' },
      locale: input.locale ?? 'en',
      toolId: input.toolId,
      toolVersion: tool.manifest.version,
      files: this.platform.files,
      ai: this.platform.ai,
      metering: this.platform.metering,
      notifications: this.platform.notifications,
      logger: this.platform.logger.child({ toolId: input.toolId, requestId }),
      signal: input.signal,
    };
    return tool.handler.execute(parsed.data, ctx);
  }
}

/* ── Server ── */

const logger = createLogger({ service: 'qr-service', env: env.NODE_ENV });

const ExecuteBodySchema = z.object({
  input: z.unknown(),
  locale: z.string().min(2).max(10).optional(),
});

export async function buildServer(): Promise<{ app: FastifyInstance; registry: ToolRegistry }> {
  const app = Fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
    requestIdHeader: 'x-toolforge-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    trustProxy: 1,
    bodyLimit: 64 * 1024,
    ajv: { customOptions: { removeAdditional: 'all', coerceTypes: false, useDefaults: true } },
  });

  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (env.NODE_ENV === 'development' && env.CORS_ALLOWED_ORIGINS.length === 0) {
        cb(null, true);
        return;
      }
      cb(null, env.CORS_ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
    maxAge: 600,
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIMEWINDOW_MS,
    hook: 'onRequest',
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  app.setErrorHandler((err: FastifyError, request, reply) => {
    const status = err.statusCode ?? 500;
    request.log.error({ err }, 'request failed');
    void reply.status(status).send({
      type: `https://errors.toolforge.dev/${err.code || 'internal'}`,
      title: err.name || 'Error',
      status,
      detail: err.message,
      code: err.code,
      retryable: status >= 500,
      traceId: request.id,
    });
  });
  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      type: 'https://errors.toolforge.dev/not_found',
      title: 'Not Found',
      status: 404,
      detail: `Route ${request.method} ${request.url} does not exist.`,
      code: 'not_found',
      retryable: false,
      traceId: request.id,
    });
  });

  const registry = new ToolRegistry({
    files: new NoopFilesClient(),
    ai: noopAi,
    metering: noopMetering,
    notifications: noopNotifications,
    logger,
  });
  for (const t of allTools) registry.register(t);

  // Tool routes
  const untyped = app as unknown as FastifyInstance;

  untyped.get('/v1/tools', () => ({ tools: registry.list() }));

  untyped.get<{ Params: { toolId: string } }>('/v1/tools/:toolId', (request, reply) => {
    const tool = registry.get(request.params.toolId);
    if (!tool) {
      void reply.status(404).send({
        type: 'https://errors.toolforge.dev/tool.not_found',
        title: 'ToolNotFound',
        status: 404,
        detail: `Unknown tool: ${request.params.toolId}`,
        code: 'tool.not_found',
        retryable: false,
        traceId: request.id,
      });
      return;
    }
    void reply.send({ manifest: tool.manifest });
  });

  untyped.post<{ Params: { toolId: string }; Body: unknown }>(
    '/v1/tools/:toolId/execute',
    async (request, reply) => {
      const parsed = ExecuteBodySchema.safeParse(request.body);
      if (!parsed.success) {
        void reply.status(400).send({
          type: 'https://errors.toolforge.dev/validation.failed',
          title: 'ValidationError',
          status: 400,
          detail: 'Invalid request envelope',
          code: 'validation.failed',
          retryable: false,
          traceId: request.id,
          details: parsed.error.flatten(),
        });
        return;
      }
      const ac = new AbortController();
      request.raw.once('aborted', () => {
        ac.abort();
      });
      try {
        const result = await registry.execute({
          toolId: request.params.toolId,
          rawInput: parsed.data.input,
          ...(parsed.data.locale !== undefined && { locale: parsed.data.locale }),
          requestId: request.id,
          signal: ac.signal,
        });
        if (result.kind === 'error') {
          const status = isPlatformError(result.error) ? result.error.status : 500;
          void reply
            .status(status)
            .send(
              isPlatformError(result.error)
                ? result.error.toProblemDetails(request.id)
                : toPlatformError(result.error).toProblemDetails(request.id),
            );
          return;
        }
        void reply.send(result);
      } catch (err) {
        if (err instanceof ToolNotFoundError) {
          void reply.status(404).send({
            type: 'https://errors.toolforge.dev/tool.not_found',
            title: 'ToolNotFound',
            status: 404,
            detail: err.message,
            code: 'tool.not_found',
            retryable: false,
            traceId: request.id,
          });
          return;
        }
        if (err instanceof ToolInputValidationError) {
          void reply.status(400).send({
            type: 'https://errors.toolforge.dev/validation.failed',
            title: 'ValidationError',
            status: 400,
            detail: err.message,
            code: 'validation.failed',
            retryable: false,
            traceId: request.id,
            details: err.flatten,
          });
          return;
        }
        throw err;
      }
    },
  );

  registerHealthRoutes(untyped);

  return { app: untyped, registry };
}
