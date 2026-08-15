import { parseToolManifest, type ToolManifest } from '@toolforge/tool-contract';

/**
 * Manifest for `pdf-inspect` — a small, read-only helper tool (not a
 * user-facing landing page) that lets a client learn a PDF's page count
 * before committing to a split. Added alongside the pdf-split web redesign
 * (P1 Phase C, checkpoint C5) so the page-tile selector can render the
 * right number of tiles before the user clicks "Split PDF". Reuses the
 * pdf-lib dependency pdf-split already has — no new dependency, no file
 * writes, no metering event (not a billable operation).
 */
export const manifest: ToolManifest = parseToolManifest({
  id: 'pdf-inspect',
  slug: 'pdf-inspect',
  version: '0.1.0',
  category: 'pdf',
  display: {
    name: 'PDF Inspect',
    tagline: 'Read basic metadata, like page count, from an uploaded PDF.',
    description:
      'Internal read-only helper used by the PDF Split UI to learn a PDF’s page count before splitting. Not a standalone user-facing tool.',
  },
  inputs: [
    {
      name: 'fileId',
      kind: 'json',
      required: true,
      description: 'File ID of a previously uploaded PDF (via /v1/_dev/files in dev).',
    },
  ],
  outputs: [
    {
      name: 'pageCount',
      kind: 'json',
      description: 'Number of pages in the PDF.',
    },
  ],
  processing: {
    mode: 'sync',
    durationClass: 'lt-1s',
    runtime: 'node',
  },
  pricing: { tier: 'free' },
  seo: {
    titlePattern: 'PDF Inspect (internal)',
    descriptionPattern: 'Internal helper tool — not a public landing page.',
    keywords: [],
  },
  i18n: {
    defaultLocale: 'en',
    supportedLocales: ['en'],
    seoCuratedLocales: ['en'],
  },
  dependencies: {
    platformServices: ['files'],
    externalServices: [],
  },
  policies: {
    maxInputBytes: 50 * 1024 * 1024,
    maxOutputBytes: 1024,
    retentionSeconds: 0,
    syncTimeoutMs: 10_000,
  },
});
