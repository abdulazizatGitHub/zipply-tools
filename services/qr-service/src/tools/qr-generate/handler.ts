import { ValidationError } from '@toolforge/errors';
import { defineTool } from '@toolforge/tool-contract';
import QRCode from 'qrcode';
import { z } from 'zod';

import { manifest } from './manifest.js';

const ECL_VALUES = ['L', 'M', 'Q', 'H'] as const;
type ECL = (typeof ECL_VALUES)[number];

const inputSchema = z.object({
  /** Pre-formatted content string from the client. */
  content: z.string().min(1).max(4296),
  /** Error-correction level. Default H so heavy visual styling still scans. */
  errorCorrectionLevel: z.enum(ECL_VALUES).default('H'),
  /** Output PNG pixel size. */
  size: z.number().int().min(64).max(1200).default(400),
  /** Quiet-zone modules around the QR. */
  margin: z.number().int().min(0).max(10).default(1),
});

const outputSchema = z.object({
  /** base64 PNG data URL — load as <img src> or draw onto Canvas. */
  dataUrl: z.string(),
  /** Raw SVG string for vector export. */
  svgString: z.string(),
  /** QR module grid size N (the QR is N × N modules). */
  moduleCount: z.number().int().positive(),
  /** Raw module matrix (0/1 per cell, row-major) for client-side styled rendering. */
  modules: z.object({
    data: z.array(z.number()),
    size: z.number().int().positive(),
  }),
});

export default defineTool({
  manifest,
  input: inputSchema,
  output: outputSchema,
  async execute(input, ctx) {
    if (!input.content.trim()) {
      return {
        kind: 'error',
        error: new ValidationError({
          message: 'content must not be empty',
          code: 'qr.empty_content',
        }),
      };
    }

    const ecl: ECL = input.errorCorrectionLevel;
    const qrOpts = { errorCorrectionLevel: ecl, margin: input.margin };

    // Generate data URL (PNG)
    const dataUrl = await QRCode.toDataURL(input.content, {
      ...qrOpts,
      width: input.size,
      color: { dark: '#000000', light: '#ffffff' },
    });

    // Generate SVG string
    const svgString = await QRCode.toString(input.content, {
      ...qrOpts,
      type: 'svg',
    });

    // Derive module count + raw matrix from QR create
    const qrObj = QRCode.create(input.content, { errorCorrectionLevel: ecl });
    const moduleCount = qrObj.modules.size;
    const moduleData = Array.from(qrObj.modules.data);

    ctx.metering.record({
      meterKey: 'qr.generate.invocations',
      quantity: 1,
      attributes: { contentLength: input.content.length, ecl, size: input.size },
    });

    ctx.logger.info({ toolId: manifest.id, moduleCount, ecl }, 'qr-generate complete');

    return {
      kind: 'sync',
      output: {
        dataUrl,
        svgString,
        moduleCount,
        modules: { data: moduleData, size: moduleCount },
      },
    };
  },
});
