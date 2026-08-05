import { randomUUID } from 'node:crypto';

import { createLogger } from '@toolforge/telemetry';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import tool from './handler.js';
import { manifest } from './manifest.js';
import { InMemoryFilesClient } from '../../registry/files-memory.js';
import { noopAi, noopMetering, noopNotifications } from '../../registry/platform-stubs.js';

async function makePdf(text: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  page.drawText(text, { x: 50, y: 700 });
  return await doc.save();
}

describe('pdf-merge handler', () => {
  it('manifest is contract-valid and has the expected id', () => {
    expect(manifest.id).toBe('pdf-merge');
    expect(manifest.outputs[0]?.mimeType).toBe('application/pdf');
  });

  it('merges two PDFs end-to-end via the in-memory files client', async () => {
    const files = new InMemoryFilesClient();
    const a = files.putRaw({
      bytes: await makePdf('Doc A page 1'),
      mimeType: 'application/pdf',
    });
    const b = files.putRaw({
      bytes: await makePdf('Doc B page 1'),
      mimeType: 'application/pdf',
    });

    const logger = createLogger({ service: 'pdf-merge-test', pretty: false });
    const ctx = {
      requestId: randomUUID(),
      traceId: randomUUID(),
      user: { id: 'u', orgId: 'o', plan: 'free' as const },
      locale: 'en',
      toolId: 'pdf-merge',
      toolVersion: manifest.version,
      files,
      ai: noopAi,
      metering: noopMetering,
      notifications: noopNotifications,
      logger,
      signal: new AbortController().signal,
    };

    const result = await tool.handler.execute({ fileIds: [a.fileId, b.fileId] }, ctx);

    expect(result.kind).toBe('sync');
    if (result.kind !== 'sync') return;

    const output = result.output as {
      fileId: string;
      pageCount: number;
      sizeBytes: number;
    };
    expect(output.pageCount).toBe(2);
    expect(output.sizeBytes).toBeGreaterThan(0);

    // Verify the stored output round-trips as a valid PDF.
    const merged = await files.readBytes(output.fileId);
    const reloaded = await PDFDocument.load(merged);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it('rejects fewer than two files at the input schema', async () => {
    const files = new InMemoryFilesClient();
    const a = files.putRaw({
      bytes: await makePdf('Solo'),
      mimeType: 'application/pdf',
    });

    const parsed = tool.inputSchema.safeParse({ fileIds: [a.fileId] });
    expect(parsed.success).toBe(false);
  });
});
