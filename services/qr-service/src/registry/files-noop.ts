import type { FilesClient } from '@toolforge/tool-contract';

/**
 * No-op FilesClient for services that don't use file storage.
 * qr-generate returns data URLs directly — never touches the files layer.
 */
export class NoopFilesClient implements FilesClient {
  readBytes(_fileId: string): Promise<Uint8Array> {
    return Promise.reject(new Error('qr-service does not use file storage'));
  }
  readStream(_fileId: string): Promise<ReadableStream<Uint8Array>> {
    return Promise.reject(new Error('qr-service does not use file storage'));
  }
  write(_input: unknown): Promise<{ fileId: string; downloadUrl: string; expiresAt: string }> {
    return Promise.reject(new Error('qr-service does not use file storage'));
  }
}
