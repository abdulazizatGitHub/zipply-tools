/**
 * In-memory FilesClient.
 *
 * Foundation-phase stand-in for the real `services/files` (M3). Tools still
 * speak ONLY to the `FilesClient` interface from `@toolforge/tool-contract`,
 * so swapping this for the HTTP client at M3 is a 1-line constructor change.
 *
 * Not for production. Stores blobs in process memory; bounded by the global
 * `MAX_TOTAL_BYTES` cap below to keep a runaway tool from OOM-killing the
 * service.
 */

import { randomUUID } from 'node:crypto';

import type { FilesClient } from '@toolforge/tool-contract';

const MAX_TOTAL_BYTES = 256 * 1024 * 1024;

interface StoredFile {
  bytes: Uint8Array;
  mimeType: string;
  filename: string | undefined;
  expiresAt: number;
}

export class InMemoryFilesClient implements FilesClient {
  private readonly store = new Map<string, StoredFile>();
  private totalBytes = 0;

  /**
   * Test/dev hook: stash bytes and return a fileId tools can resolve.
   * Production tools never call this; they receive fileIds from the
   * platform's files service.
   */
  putRaw(input: {
    bytes: Uint8Array;
    mimeType: string;
    filename?: string;
    retentionSeconds?: number;
  }): { fileId: string; expiresAt: string } {
    this.evictExpired();
    if (this.totalBytes + input.bytes.byteLength > MAX_TOTAL_BYTES) {
      throw new Error('in-memory files store full');
    }

    const fileId = `mem_${randomUUID()}`;
    const ttl = input.retentionSeconds ?? 60 * 60;
    const expiresAt = Date.now() + ttl * 1000;
    this.store.set(fileId, {
      bytes: input.bytes,
      mimeType: input.mimeType,
      filename: input.filename,
      expiresAt,
    });
    this.totalBytes += input.bytes.byteLength;
    return { fileId, expiresAt: new Date(expiresAt).toISOString() };
  }

  getRaw(fileId: string): StoredFile | undefined {
    this.evictExpired();
    return this.store.get(fileId);
  }

  // FilesClient interface ----------------------------------------------------

  readBytes(fileId: string): Promise<Uint8Array> {
    const f = this.getRaw(fileId);
    if (!f) return Promise.reject(new Error(`file not found: ${fileId}`));
    return Promise.resolve(f.bytes);
  }

  readStream(fileId: string): Promise<ReadableStream<Uint8Array>> {
    const f = this.getRaw(fileId);
    if (!f) return Promise.reject(new Error(`file not found: ${fileId}`));
    const bytes = f.bytes;
    return Promise.resolve(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      }),
    );
  }

  async write(input: {
    bytes: Uint8Array | ReadableStream<Uint8Array>;
    mimeType: string;
    filename?: string;
    retentionSeconds?: number;
  }): Promise<{ fileId: string; downloadUrl: string; expiresAt: string }> {
    const bytes =
      input.bytes instanceof Uint8Array ? input.bytes : await streamToBytes(input.bytes);
    const { fileId, expiresAt } = this.putRaw({
      bytes,
      mimeType: input.mimeType,
      ...(input.filename !== undefined && { filename: input.filename }),
      ...(input.retentionSeconds !== undefined && {
        retentionSeconds: input.retentionSeconds,
      }),
    });
    return {
      fileId,
      downloadUrl: `/v1/_dev/files/${fileId}`,
      expiresAt,
    };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [id, f] of this.store) {
      if (f.expiresAt <= now) {
        this.store.delete(id);
        this.totalBytes -= f.bytes.byteLength;
      }
    }
  }
}

async function streamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
