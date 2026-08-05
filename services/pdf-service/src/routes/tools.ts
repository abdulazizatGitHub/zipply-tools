/**
 * Tool execution routes.
 *
 *   GET  /v1/tools                  → list manifests served by this service
 *   GET  /v1/tools/:toolId          → manifest for one tool
 *   POST /v1/tools/:toolId/execute  → invoke the handler
 *
 * The route layer is contract-thin: it parses the request envelope, hands
 * off to the registry, and serializes the ToolResult uniformly. Per-tool
 * input shape is enforced by Zod inside the registry, not here.
 */

import { isPlatformError, toPlatformError } from '@toolforge/errors';
import { z } from 'zod';

import {
  ToolInputValidationError,
  ToolNotFoundError,
  type ToolRegistry,
} from '../registry/index.js';

import type { FastifyInstance } from 'fastify';

const ExecuteBodySchema = z.object({
  input: z.unknown(),
  locale: z.string().min(2).max(10).optional(),
});

export function registerToolRoutes(app: FastifyInstance, registry: ToolRegistry): void {
  app.get('/v1/tools', () => ({ tools: registry.list() }));

  app.get<{ Params: { toolId: string } }>('/v1/tools/:toolId', (request, reply) => {
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

  app.post<{ Params: { toolId: string }; Body: unknown }>(
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

      // Synthesize an AbortSignal that aborts on client disconnect. Fastify v5
      // does not expose a per-request Web AbortSignal out of the box.
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
}
