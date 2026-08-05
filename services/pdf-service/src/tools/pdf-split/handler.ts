import { ValidationError } from '@toolforge/errors';
import { defineTool } from '@toolforge/tool-contract';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';

import { manifest } from './manifest.js';

const MAX_PARTS = 30;
const MAX_SOURCE_PAGES = 200;

const inputSchema = z.object({
  fileId: z.string().min(1),
  /**
   * Optional page ranges, 1-indexed. Each string is either:
   *   - A single page: "5"
   *   - A range: "1-3"
   * If omitted, the PDF is split one page per part.
   */
  ranges: z.array(z.string().min(1)).max(MAX_PARTS).optional(),
});

const partSchema = z.object({
  fileId: z.string(),
  downloadUrl: z.string(),
  expiresAt: z.string(),
  label: z.string(),
  pageCount: z.number().int().positive(),
});

const outputSchema = z.object({
  parts: z.array(partSchema),
  sourcePageCount: z.number().int().positive(),
});

/**
 * Parse a range string like "1-3" or "5" into 0-based page indices.
 * Invalid tokens produce an empty array (silently dropped — callers validate
 * the final part count before processing).
 */
function parseRange(token: string, totalPages: number): number[] {
  const t = token.trim();
  const dashIdx = t.indexOf('-');
  if (dashIdx > 0) {
    const start = parseInt(t.slice(0, dashIdx), 10);
    const end = parseInt(t.slice(dashIdx + 1), 10);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) return [];
    const s = Math.max(0, start - 1);
    const e = Math.min(totalPages - 1, end - 1);
    if (s > e) return [];
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }
  const page = parseInt(t, 10);
  if (!Number.isFinite(page) || page < 1 || page > totalPages) return [];
  return [page - 1];
}

export default defineTool({
  manifest,
  input: inputSchema,
  output: outputSchema,
  async execute(input, ctx) {
    const bytes = await ctx.files.readBytes(input.fileId);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = src.getPageCount();

    if (totalPages > MAX_SOURCE_PAGES) {
      return {
        kind: 'error',
        error: new ValidationError({
          message: `source PDF has ${String(totalPages)} pages; maximum is ${String(MAX_SOURCE_PAGES)}`,
          code: 'pdf_split.too_many_pages',
        }),
      };
    }

    // Build the list of page-index groups to extract.
    let groups: { indices: number[]; label: string }[];

    if (!input.ranges || input.ranges.length === 0) {
      // No ranges specified — one part per page.
      if (totalPages > MAX_PARTS) {
        return {
          kind: 'error',
          error: new ValidationError({
            message: `splitting all ${String(totalPages)} pages individually would produce ${String(totalPages)} files; maximum is ${String(MAX_PARTS)}. Provide explicit ranges to split larger PDFs.`,
            code: 'pdf_split.too_many_parts',
          }),
        };
      }
      groups = Array.from({ length: totalPages }, (_, i) => ({
        indices: [i],
        label: totalPages === 1 ? 'Page 1' : `Page ${String(i + 1)}`,
      }));
    } else {
      const parsed: { indices: number[]; label: string }[] = [];
      for (const r of input.ranges) {
        const indices = parseRange(r, totalPages);
        if (indices.length === 0) {
          return {
            kind: 'error',
            error: new ValidationError({
              message: `invalid range "${r}" for a ${String(totalPages)}-page PDF`,
              code: 'pdf_split.invalid_range',
            }),
          };
        }
        const first = indices[0];
        const last = indices[indices.length - 1];
        const label =
          indices.length === 1
            ? `Page ${String((first ?? 0) + 1)}`
            : `Pages ${String((first ?? 0) + 1)}–${String((last ?? 0) + 1)}`;
        parsed.push({ indices, label });
      }
      groups = parsed;
    }

    // Extract each group into its own PDF and write to the files client.
    const parts: z.infer<typeof partSchema>[] = [];
    for (const group of groups) {
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, group.indices);
      for (const p of pages) out.addPage(p);
      const outBytes = await out.save();

      const { fileId, downloadUrl, expiresAt } = await ctx.files.write({
        bytes: outBytes,
        mimeType: 'application/pdf',
        filename: `split-${group.label.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        retentionSeconds: manifest.policies.retentionSeconds,
      });

      parts.push({
        fileId,
        downloadUrl,
        expiresAt,
        label: group.label,
        pageCount: group.indices.length,
      });
    }

    ctx.metering.record({
      meterKey: 'pdf.split.invocations',
      quantity: 1,
      attributes: { sourcePages: totalPages, partCount: parts.length },
    });

    ctx.logger.info(
      { toolId: manifest.id, sourcePages: totalPages, partCount: parts.length },
      'pdf-split complete',
    );

    return {
      kind: 'sync',
      output: { parts, sourcePageCount: totalPages },
    };
  },
});
