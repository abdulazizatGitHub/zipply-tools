import { parseToolManifest, type ToolManifest } from '@toolforge/tool-contract';

/**
 * Manifest for `pdf-merge`. Parsed (validated) at module load — a malformed
 * manifest fails the build, not at runtime under traffic.
 *
 * Native-library decision: pure-JS pdf-lib. Documented in ADR-0001 — pdf-lib
 * is portable, ships in node_modules, and is sufficient for the merge case.
 * Move to a Ghostscript/qpdf container if a tool needs compression or OCR.
 */
export const manifest: ToolManifest = parseToolManifest({
  id: 'pdf-merge',
  slug: 'pdf-merge',
  version: '0.1.0',
  category: 'pdf',
  display: {
    name: 'PDF Merge',
    tagline: 'Combine multiple PDF files into one, in the order you choose.',
    description:
      'Upload PDFs and download a single merged PDF. Files are deleted automatically after 1 hour.',
  },
  inputs: [
    {
      name: 'fileIds',
      kind: 'json',
      required: true,
      description:
        'Array of file IDs (returned by /v1/_dev/files in dev, by services/files in production), in merge order.',
    },
  ],
  outputs: [
    {
      name: 'merged',
      kind: 'file',
      mimeType: 'application/pdf',
      description: 'Merged PDF file (downloadable via downloadUrl).',
    },
  ],
  processing: {
    mode: 'sync',
    durationClass: 'lt-30s',
    runtime: 'node',
  },
  pricing: { tier: 'free' },
  seo: {
    titlePattern: 'Merge PDFs Online · ToolForge',
    descriptionPattern:
      'Combine PDFs in your browser. Free, fast, private. Files auto-delete after 1 hour.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf', 'pdf merger'],
    faqs: [
      {
        q: 'How many PDFs can I merge at once?',
        a: 'Up to 20 files, totaling 50 MB.',
      },
      {
        q: 'Are my files stored?',
        a: 'They are kept briefly to enable download and then deleted automatically (within 1 hour).',
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
    maxOutputBytes: 50 * 1024 * 1024,
    retentionSeconds: 60 * 60,
    syncTimeoutMs: 30_000,
  },
});
