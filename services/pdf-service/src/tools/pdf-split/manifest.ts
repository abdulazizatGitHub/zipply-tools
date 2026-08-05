import { parseToolManifest, type ToolManifest } from '@toolforge/tool-contract';

export const manifest: ToolManifest = parseToolManifest({
  id: 'pdf-split',
  slug: 'pdf-split',
  version: '0.1.0',
  category: 'pdf',
  display: {
    name: 'PDF Split',
    tagline: 'Extract pages or split a PDF into separate files.',
    description:
      'Upload a PDF, define page ranges (e.g. "1-3, 4-6"), and download each part as its own file. Leave ranges empty to split every page individually.',
  },
  inputs: [
    {
      name: 'fileId',
      kind: 'json',
      required: true,
      description: 'File ID of the source PDF (uploaded via /v1/_dev/files in dev).',
    },
    {
      name: 'ranges',
      kind: 'json',
      required: false,
      description:
        'Optional array of page-range strings, e.g. ["1-3", "4-6", "7"]. Leave empty to split into one file per page. Pages are 1-indexed.',
    },
  ],
  outputs: [
    {
      name: 'parts',
      kind: 'json',
      description: 'Array of split PDF parts, each with a fileId and downloadUrl.',
    },
  ],
  processing: {
    mode: 'sync',
    durationClass: 'lt-30s',
    runtime: 'node',
  },
  pricing: { tier: 'free' },
  seo: {
    titlePattern: 'Split PDF Online · ToolForge',
    descriptionPattern:
      'Split a PDF into separate files by page range. Free, fast, private. Files auto-delete after 1 hour.',
    keywords: ['split pdf', 'extract pdf pages', 'pdf splitter', 'separate pdf pages'],
    faqs: [
      {
        q: 'How do I split a PDF into specific pages?',
        a: 'Upload your PDF and enter ranges like "1-3, 4-6". Each range becomes its own file.',
      },
      {
        q: 'Can I extract just one page?',
        a: 'Yes — enter a single page number like "5" to extract just that page.',
      },
      {
        q: 'Are my files stored?',
        a: 'Files are kept briefly for download and deleted automatically within 1 hour.',
      },
    ],
  },
  i18n: {
    defaultLocale: 'en',
    supportedLocales: ['en'],
    seoCuratedLocales: ['en'],
  },
  dependencies: {
    platformServices: ['files', 'metering'],
    externalServices: [],
  },
  policies: {
    maxInputBytes: 50 * 1024 * 1024,
    maxOutputBytes: 100 * 1024 * 1024,
    retentionSeconds: 60 * 60,
    syncTimeoutMs: 30_000,
  },
});
