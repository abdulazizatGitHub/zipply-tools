import { ValidationError } from '@toolforge/errors';
import { defineTool } from '@toolforge/tool-contract';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';

import { manifest } from './manifest.js';

/**
 * pdf-merge — concatenate the input PDFs in order and return a new fileId.
 *
 * The handler never touches R2/S3 or local disk directly. It reads inputs
 * through `ctx.files.readBytes` and writes the output through `ctx.files.write`.
 * In dev that's the in-memory client; in production the same call goes to
 * services/files via the HTTP client. The tool code does not change.
 */

const MAX_FILES = 20;
const TOTAL_BYTE_BUDGET = manifest.policies.maxInputBytes;

const inputSchema = z.object({
  fileIds: z.array(z.string().min(1)).min(2).max(MAX_FILES),
});

const outputSchema = z.object({
  fileId: z.string().min(1),
  downloadUrl: z.string(),
  expiresAt: z.string(),
  pageCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative(),
});

export default defineTool({
  manifest,
  input: inputSchema,
  output: outputSchema,
  async execute(input, ctx) {
    ctx.logger.info({ toolId: manifest.id, fileCount: input.fileIds.length }, 'pdf-merge invoked');

    // Load all sources first; fail fast on a missing/oversized input.
    const sources: Uint8Array[] = [];
    let totalBytes = 0;
    for (const fileId of input.fileIds) {
      const bytes = await ctx.files.readBytes(fileId);
      totalBytes += bytes.byteLength;
      if (totalBytes > TOTAL_BYTE_BUDGET) {
        return {
          kind: 'error',
          error: new ValidationError({
            message: `total input size exceeds ${String(TOTAL_BYTE_BUDGET)} bytes`,
            code: 'pdf_merge.input_too_large',
          }),
        };
      }
      sources.push(bytes);
    }

    const merged = await PDFDocument.create();
    for (const bytes of sources) {
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      for (const p of pages) merged.addPage(p);
    }
    const out = await merged.save();

    const { fileId, downloadUrl, expiresAt } = await ctx.files.write({
      bytes: out,
      mimeType: 'application/pdf',
      filename: 'merged.pdf',
      retentionSeconds: manifest.policies.retentionSeconds,
    });

    ctx.metering.record({
      meterKey: 'pdf.merge.invocations',
      quantity: 1,
      attributes: {
        inputCount: input.fileIds.length,
        outputBytes: out.byteLength,
      },
    });

    return {
      kind: 'sync',
      output: {
        fileId,
        downloadUrl,
        expiresAt,
        pageCount: merged.getPageCount(),
        sizeBytes: out.byteLength,
      },
    };
  },
});
