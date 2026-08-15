import { randomUUID } from 'node:crypto';

import { createLogger } from '@toolforge/telemetry';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import tool from './handler.js';
import { manifest } from './manifest.js';
import { InMemoryFilesClient } from '../../registry/files-memory.js';
import { noopAi, noopMetering, noopNotifications } from '../../registry/platform-stubs.js';

async function makePdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage();
  return await doc.save();
}

function makeCtx(files: InMemoryFilesClient) {
  return {
    requestId: randomUUID(),
    traceId: randomUUID(),
    user: { id: 'u', orgId: 'o', plan: 'free' as const },
    locale: 'en',
    toolId: 'pdf-inspect',
    toolVersion: manifest.version,
    files,
    ai: noopAi,
    metering: noopMetering,
    notifications: noopNotifications,
    logger: createLogger({ service: 'pdf-inspect-test', pretty: false }),
    signal: new AbortController().signal,
  };
}

describe('pdf-inspect handler', () => {
  it('manifest is contract-valid and has the expected id', () => {
    expect(manifest.id).toBe('pdf-inspect');
  });

  it('returns the page count of an uploaded PDF', async () => {
    const files = new InMemoryFilesClient();
    const { fileId } = files.putRaw({ bytes: await makePdf(5), mimeType: 'application/pdf' });

    const result = await tool.handler.execute({ fileId }, makeCtx(files));

    expect(result.kind).toBe('sync');
    if (result.kind !== 'sync') return;
    expect(result.output.pageCount).toBe(5);
  });

  it('reports a single page correctly', async () => {
    const files = new InMemoryFilesClient();
    const { fileId } = files.putRaw({ bytes: await makePdf(1), mimeType: 'application/pdf' });

    const result = await tool.handler.execute({ fileId }, makeCtx(files));

    expect(result.kind).toBe('sync');
    if (result.kind !== 'sync') return;
    expect(result.output.pageCount).toBe(1);
  });

  it('rejects an empty fileId at the input schema', () => {
    const parsed = tool.inputSchema.safeParse({ fileId: '' });
    expect(parsed.success).toBe(false);
  });
});
