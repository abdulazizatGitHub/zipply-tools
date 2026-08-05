import { describe, it, expect } from 'vitest';

import { ToolManifestSchema, parseToolManifest } from './manifest.js';

const validManifest = {
  id: 'pdf-merge',
  slug: 'pdf-merge',
  version: '0.1.0',
  category: 'pdf',
  display: {
    name: 'PDF Merge',
    tagline: 'Combine multiple PDF files into one',
    description: 'Upload PDFs in order and download a single merged PDF.',
  },
  inputs: [
    {
      name: 'files',
      kind: 'file',
      required: true,
      acceptMimeTypes: ['application/pdf'],
      maxBytes: 50 * 1024 * 1024,
    },
  ],
  outputs: [{ name: 'merged', kind: 'file', mimeType: 'application/pdf' }],
  processing: {
    mode: 'sync',
    durationClass: 'lt-30s',
    runtime: 'node',
  },
  pricing: { tier: 'free' },
  seo: {
    titlePattern: 'Merge PDFs Online — ToolForge',
    descriptionPattern: 'Combine PDFs in your browser. Free, fast, private.',
    keywords: ['merge pdf', 'combine pdf'],
  },
  i18n: {
    defaultLocale: 'en',
    supportedLocales: ['en', 'es', 'de'],
  },
  dependencies: { platformServices: ['files', 'metering'] },
  policies: {
    maxInputBytes: 100 * 1024 * 1024,
    maxOutputBytes: 100 * 1024 * 1024,
    retentionSeconds: 3600,
    syncTimeoutMs: 30_000,
  },
};

describe('ToolManifestSchema', () => {
  it('accepts a fully-formed manifest', () => {
    const m = parseToolManifest(validManifest);
    expect(m.id).toBe('pdf-merge');
    expect(m.manifestVersion).toBe('1');
  });

  it('rejects bad slugs', () => {
    expect(() => parseToolManifest({ ...validManifest, slug: 'Bad Slug!' })).toThrow();
  });

  it('rejects bad version strings', () => {
    expect(() => parseToolManifest({ ...validManifest, version: '1.0' })).toThrow();
  });

  it('rejects empty supportedLocales', () => {
    expect(() =>
      ToolManifestSchema.parse({
        ...validManifest,
        i18n: { defaultLocale: 'en', supportedLocales: [] },
      }),
    ).toThrow();
  });
});
