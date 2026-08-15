import { defineTool } from '@toolforge/tool-contract';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';

import { manifest } from './manifest.js';

/**
 * pdf-inspect — read a previously uploaded PDF's page count. Read-only: no
 * output file is written and no metering event is recorded, since this
 * isn't a billable product action, just metadata the client needs to render
 * pdf-split's page-tile selector ahead of the actual split.
 */

const inputSchema = z.object({
  fileId: z.string().min(1),
});

const outputSchema = z.object({
  pageCount: z.number().int().positive(),
});

export default defineTool({
  manifest,
  input: inputSchema,
  output: outputSchema,
  async execute(input, ctx) {
    const bytes = await ctx.files.readBytes(input.fileId);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    ctx.logger.info({ toolId: manifest.id, pageCount: doc.getPageCount() }, 'pdf-inspect invoked');

    return {
      kind: 'sync',
      output: { pageCount: doc.getPageCount() },
    };
  },
});
