import { parseToolManifest, type ToolManifest } from '@toolforge/tool-contract';

export const manifest: ToolManifest = parseToolManifest({
  id: 'qr-generate',
  slug: 'qr-generate',
  version: '0.1.0',
  category: 'qr',
  display: {
    name: 'QR Generator',
    tagline: 'Generate stylish, branded QR codes with custom shapes and card templates.',
    description:
      'Encode a URL, contact, WiFi credentials, or any text into a QR code. ' +
      'Returns the raw QR as a PNG data URL and the module matrix for client-side styling.',
  },
  inputs: [
    {
      name: 'content',
      kind: 'text',
      required: true,
      maxLength: 4296,
      description: 'The encoded string — already formatted by the client (WiFi, vCard, etc.).',
    },
    {
      name: 'errorCorrectionLevel',
      kind: 'text',
      required: false,
      description: 'L / M / Q / H. Defaults to H for shaped QR codes.',
    },
    {
      name: 'size',
      kind: 'number',
      required: false,
      min: 64,
      max: 1200,
      description: 'Pixel width of the output PNG. Defaults to 400.',
    },
    {
      name: 'margin',
      kind: 'number',
      required: false,
      min: 0,
      max: 10,
      description: 'Quiet-zone modules. Defaults to 1.',
    },
  ],
  outputs: [
    {
      name: 'dataUrl',
      kind: 'url',
      description: 'Base-64 PNG data URL of the raw QR code (white bg, black modules).',
    },
    {
      name: 'svgString',
      kind: 'text',
      description: 'Raw SVG string of the QR code for vector export.',
    },
    {
      name: 'moduleCount',
      kind: 'json',
      description: 'NxN grid size (number of modules per side).',
    },
    {
      name: 'modules',
      kind: 'json',
      description:
        'Raw QR module matrix — { data: number[] (0/1 per cell, row-major), size: number } — for client-side styled rendering (dot shapes, colors, custom QR shapes).',
    },
  ],
  processing: {
    mode: 'sync',
    durationClass: 'lt-1s',
    runtime: 'node',
  },
  pricing: { tier: 'free' },
  seo: {
    titlePattern: 'QR Code Generator — ToolForge',
    descriptionPattern:
      'Generate custom QR codes with shapes, frames and card templates. Free, no sign-up.',
    keywords: [
      'qr code generator',
      'custom qr code',
      'qr code maker',
      'free qr code',
      'qr code with logo',
    ],
    faqs: [
      {
        q: 'What can a QR code encode?',
        a: 'URLs, plain text, WiFi credentials, contact cards (vCard), email, phone and SMS.',
      },
      {
        q: 'Can I use a logo inside the QR?',
        a: 'Yes — the client overlays your logo in the centre. High error correction ensures the QR still scans.',
      },
      {
        q: 'Is the generated QR permanent?',
        a: 'The QR itself is generated on the fly and never stored. Download it to keep it.',
      },
    ],
  },
  i18n: { defaultLocale: 'en', supportedLocales: ['en'], seoCuratedLocales: ['en'] },
  dependencies: { platformServices: ['metering'], externalServices: [] },
  policies: {
    maxInputBytes: 64 * 1024,
    maxOutputBytes: 2 * 1024 * 1024,
    retentionSeconds: 0,
    syncTimeoutMs: 5_000,
  },
});
