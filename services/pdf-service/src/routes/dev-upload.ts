/**
 * Dev-only file upload/download routes.
 *
 * Gated by env.ENABLE_DEV_UPLOAD_ROUTE. These exist solely so a developer
 * can exercise the end-to-end PDF merge flow without standing up the real
 * files service yet. Phase 2 turns this off in staging/production.
 *
 * Routes:
 *   POST /v1/_dev/files           → upload raw bytes, return { fileId }
 *   GET  /v1/_dev/files/:fileId   → stream bytes back
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { InMemoryFilesClient } from '../registry/files-memory.js';

const MAX_DEV_UPLOAD_BYTES = 50 * 1024 * 1024;

export function registerDevUploadRoutes(app: FastifyInstance, files: InMemoryFilesClient): void {
  // Register raw body parsers so Fastify accepts binary content types.
  // Without this Fastify 5 returns 415 for anything that isn't application/json.
  // parseAs: 'buffer' means Fastify collects the stream into a Buffer before
  // calling the parser — we just pass it straight through.
  // _req is typed as FastifyRequest to satisfy the overload that pairs with
  // parseAs:'buffer'; the value is unused.
  const bufferPassthrough = (
    _req: FastifyRequest,
    body: Buffer,
    done: (err: Error | null, body?: Buffer) => void,
  ) => {
    done(null, body);
  };

  app.addContentTypeParser(
    'application/pdf',
    { parseAs: 'buffer', bodyLimit: MAX_DEV_UPLOAD_BYTES },
    bufferPassthrough,
  );
  app.addContentTypeParser(
    'application/octet-stream',
    { parseAs: 'buffer', bodyLimit: MAX_DEV_UPLOAD_BYTES },
    bufferPassthrough,
  );

  app.post<{ Body: Buffer }>('/v1/_dev/files', {}, (request, reply) => {
    const contentType = request.headers['content-type'] ?? 'application/octet-stream';
    const body = request.body;

    if (body.byteLength === 0) {
      void reply.status(400).send({
        type: 'https://errors.toolforge.dev/validation.failed',
        title: 'ValidationError',
        status: 400,
        detail: 'Request body is empty',
        code: 'validation.failed',
        retryable: false,
        traceId: request.id,
      });
      return;
    }

    const bytes = new Uint8Array(body);
    const { fileId, expiresAt } = files.putRaw({
      bytes,
      mimeType: contentType,
      retentionSeconds: 60 * 60,
    });
    void reply.status(201).send({ fileId, expiresAt, sizeBytes: bytes.byteLength });
  });

  app.get<{ Params: { fileId: string } }>('/v1/_dev/files/:fileId', (request, reply) => {
    const stored = files.getRaw(request.params.fileId);
    if (!stored) {
      void reply.status(404).send({
        type: 'https://errors.toolforge.dev/resource.not_found',
        title: 'NotFound',
        status: 404,
        detail: `Unknown file id: ${request.params.fileId}`,
        code: 'resource.not_found',
        retryable: false,
        traceId: request.id,
      });
      return;
    }
    void reply
      .header('content-type', stored.mimeType)
      .header('content-length', String(stored.bytes.byteLength))
      .header('content-disposition', `attachment; filename="${stored.filename ?? 'download'}"`)
      .send(Buffer.from(stored.bytes));
  });
}
