/**
 * @toolforge/files-client
 *
 * Typed client for the files service: presigned uploads/downloads, retention,
 * virus-scan and processing status. R2/S3 SDK usage is forbidden everywhere
 * except inside the files service itself. This boundary lets us swap R2 for
 * S3 (or add a second backend per region) without touching tools.
 *
 * Pattern:
 *   1) tool calls createUpload() to obtain a presigned PUT URL
 *   2) client (browser or tool worker) uploads directly to object storage
 *   3) tool calls finalize() to register the upload and trigger scan
 *   4) tool processes and writes outputs back via createUpload + finalize
 *   5) tool calls createDownload() for the consumer-facing URL
 */

import { HttpClient, type HttpClientOptions } from '@toolforge/platform-client';
import { z } from 'zod';

export const FileVisibilitySchema = z.enum(['private', 'org', 'public']);
export type FileVisibility = z.infer<typeof FileVisibilitySchema>;

export const FileScanStatusSchema = z.enum(['pending', 'clean', 'infected', 'errored', 'skipped']);
export type FileScanStatus = z.infer<typeof FileScanStatusSchema>;

export const PresignedUploadSchema = z.object({
  fileId: z.string().min(1),
  /** PUT URL with short TTL. Do not log. */
  uploadUrl: z.string().url(),
  /** Headers the uploader MUST send (Content-Type, etc.). */
  requiredHeaders: z.record(z.string()),
  /** Expiry of the presigned URL (ISO). */
  expiresAt: z.string().datetime(),
});

export type PresignedUpload = z.infer<typeof PresignedUploadSchema>;

export const PresignedDownloadSchema = z.object({
  fileId: z.string().min(1),
  downloadUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  filename: z.string().optional(),
  contentType: z.string().optional(),
});

export type PresignedDownload = z.infer<typeof PresignedDownloadSchema>;

export const FileMetaSchema = z.object({
  id: z.string().min(1),
  ownerOrgId: z.string().min(1),
  toolId: z.string().min(1),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  scanStatus: FileScanStatusSchema,
  visibility: FileVisibilitySchema,
  createdAt: z.string().datetime(),
  /** ISO timestamp of automatic deletion. Null = retained indefinitely. */
  retainUntil: z.string().datetime().nullable(),
  checksumSha256: z.string().optional(),
});

export type FileMeta = z.infer<typeof FileMetaSchema>;

export interface CreateUploadInput {
  orgId: string;
  toolId: string;
  contentType: string;
  sizeBytes: number;
  filename?: string;
  visibility?: FileVisibility;
  /** Retention hint in seconds. Service caps to plan limits. */
  retainForSeconds?: number;
}

export interface FilesClientOptions extends Omit<HttpClientOptions, 'serviceName'> {
  serviceName?: string;
}

export interface FilesClient {
  createUpload(input: CreateUploadInput, signal?: AbortSignal): Promise<PresignedUpload>;
  finalize(fileId: string, signal?: AbortSignal): Promise<FileMeta>;
  getMeta(fileId: string, signal?: AbortSignal): Promise<FileMeta>;
  createDownload(
    fileId: string,
    ttlSeconds?: number,
    signal?: AbortSignal,
  ): Promise<PresignedDownload>;
  deleteFile(fileId: string, signal?: AbortSignal): Promise<void>;
}

export class HttpFilesClient extends HttpClient implements FilesClient {
  constructor(options: FilesClientOptions) {
    super({ ...options, serviceName: options.serviceName ?? 'files-client' });
  }

  async createUpload(input: CreateUploadInput, signal?: AbortSignal): Promise<PresignedUpload> {
    const raw = await this.post<unknown>('/v1/uploads', {
      body: input,
      ...(signal ? { signal } : {}),
    });
    return PresignedUploadSchema.parse(raw);
  }

  async finalize(fileId: string, signal?: AbortSignal): Promise<FileMeta> {
    const raw = await this.post<unknown>(
      `/v1/files/${encodeURIComponent(fileId)}/finalize`,
      signal ? { signal } : {},
    );
    return FileMetaSchema.parse(raw);
  }

  async getMeta(fileId: string, signal?: AbortSignal): Promise<FileMeta> {
    const raw = await this.get<unknown>(
      `/v1/files/${encodeURIComponent(fileId)}`,
      signal ? { signal } : {},
    );
    return FileMetaSchema.parse(raw);
  }

  async createDownload(
    fileId: string,
    ttlSeconds?: number,
    signal?: AbortSignal,
  ): Promise<PresignedDownload> {
    const raw = await this.post<unknown>(`/v1/files/${encodeURIComponent(fileId)}/downloads`, {
      body: { ttlSeconds },
      ...(signal ? { signal } : {}),
    });
    return PresignedDownloadSchema.parse(raw);
  }

  async deleteFile(fileId: string, signal?: AbortSignal): Promise<void> {
    await this.request<undefined>({
      method: 'DELETE',
      path: `/v1/files/${encodeURIComponent(fileId)}`,
      ...(signal ? { signal } : {}),
    });
  }
}
