'use client';
/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */

import { Button, DropZone, ProcessingPanel, ResultPanel, StepIndicator } from '@toolforge/ui';
import { useCallback, useRef, useState } from 'react';

import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconFilePdf,
  IconGripVertical,
  IconPlus,
  IconSplit,
  IconX,
} from '../../components/icons';

import type { DragEvent } from 'react';

interface FileItem {
  id: string;
  file: File;
  fileId?: string;
  uploadState: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

type MergeState =
  | { status: 'idle' }
  | { status: 'merging' }
  | { status: 'done'; downloadUrl: string; pageCount: number; sizeBytes: number }
  | { status: 'error'; message: string };

const STEPS = ['Upload files', 'Merge', 'Download'];

export function PdfMergeClient({
  apiBase,
  pdfServiceBase,
}: {
  apiBase: string;
  pdfServiceBase: string;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [merge, setMerge] = useState<MergeState>({ status: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);

  /* Derived step for the indicator */
  const currentStep =
    merge.status === 'done' ? 2 : merge.status === 'merging' ? 1 : files.length >= 2 ? 1 : 0;

  const addFiles = (incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfs.length) return;
    setFiles((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ id: crypto.randomUUID(), file: f, uploadState: 'pending' as const })),
    ]);
    if (merge.status !== 'idle') setMerge({ status: 'idle' });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const onDragStart = (idx: number) => {
    dragItem.current = idx;
  };
  const onDragEnter = (idx: number) => {
    const from = dragItem.current;
    if (from === null || from === idx) return;
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (!moved) return prev;
      next.splice(idx, 0, moved);
      dragItem.current = idx;
      return next;
    });
  };

  const uploadAll = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (const item of files) {
      if (item.uploadState === 'done' && item.fileId) {
        ids.push(item.fileId);
        continue;
      }
      setFiles((p) => p.map((f) => (f.id === item.id ? { ...f, uploadState: 'uploading' } : f)));
      try {
        const res = await fetch(`${pdfServiceBase}/v1/_dev/files`, {
          method: 'POST',
          headers: { 'content-type': 'application/pdf' },
          body: item.file,
        });
        if (!res.ok) throw new Error(`Upload failed (${String(res.status)})`);
        const data = (await res.json()) as { fileId: string };
        setFiles((p) =>
          p.map((f) => (f.id === item.id ? { ...f, uploadState: 'done', fileId: data.fileId } : f)),
        );
        ids.push(data.fileId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setFiles((p) =>
          p.map((f) => (f.id === item.id ? { ...f, uploadState: 'error', error: msg } : f)),
        );
        throw new Error(`Failed to upload "${item.file.name}": ${msg}`);
      }
    }
    return ids;
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setMerge({ status: 'merging' });
    try {
      const fileIds = await uploadAll();
      const res = await fetch(`${apiBase}/v1/tools/pdf-merge/execute`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: { fileIds } }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail ?? `Merge failed (${String(res.status)})`);
      }
      const data = (await res.json()) as {
        output: { downloadUrl: string; pageCount: number; sizeBytes: number };
      };
      setMerge({
        status: 'done',
        downloadUrl: data.output.downloadUrl.startsWith('http')
          ? data.output.downloadUrl
          : `${pdfServiceBase}${data.output.downloadUrl}`,
        pageCount: data.output.pageCount,
        sizeBytes: data.output.sizeBytes,
      });
    } catch (err) {
      setMerge({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  };

  const reset = () => {
    setFiles([]);
    setMerge({ status: 'idle' });
  };

  const fmt = (n: number) =>
    n < 1_048_576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1_048_576).toFixed(2)} MB`;
  const totalSize = files.reduce((s, f) => s + f.file.size, 0);

  return (
    <div className="space-y-5">
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
        }}
      />

      {merge.status === 'merging' ? (
        <ProcessingPanel
          label={`Merging ${String(files.length)} PDF${files.length !== 1 ? 's' : ''}…`}
        />
      ) : merge.status === 'done' ? (
        <ResultPanel
          heading="Merge complete!"
          subtext={`${String(merge.pageCount)} pages · ${fmt(merge.sizeBytes)} · ready to download`}
        >
          <a
            href={merge.downloadUrl}
            download="merged.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl bg-brand px-8 py-3.5 text-sm font-semibold text-neutral-0 transition-opacity hover:opacity-90"
          >
            <IconDownload className="h-4 w-4" />
            Download merged.pdf
          </a>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={reset}
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-700 hover:underline"
            >
              Merge more files
            </button>
            <span className="text-neutral-200">·</span>
            <a
              href="/pdf-split"
              className="flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-brand"
            >
              <IconSplit className="h-3.5 w-3.5" /> Try PDF Split
            </a>
          </div>

          <p className="mt-6 text-xs text-neutral-400">
            File will be automatically deleted within 1 hour
          </p>
        </ResultPanel>
      ) : (
        <>
          {/* ── Drop zone ── */}
          <DropZone onClick={() => inputRef.current?.click()} onDrop={onDrop}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
              {files.length ? (
                <IconPlus className="h-6 w-6 text-brand" />
              ) : (
                <IconFilePdf className="h-6 w-6 text-brand" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700">
                {files.length ? (
                  <>
                    Add more PDFs, or <span className="text-brand">browse</span>
                  </>
                ) : (
                  <>
                    Drop PDF files here, or <span className="text-brand">browse</span>
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Up to 20 files · 50 MB total · PDF only
              </p>
            </div>
          </DropZone>

          {/* ── File list ── */}
          {files.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {files.length} file{files.length !== 1 ? 's' : ''} · {fmt(totalSize)}
                </span>
                <span className="text-xs text-neutral-400">Drag rows to reorder</span>
              </div>

              <ul className="divide-y divide-neutral-100">
                {files.map((item, idx) => (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={() => {
                      onDragStart(idx);
                    }}
                    onDragEnter={() => {
                      onDragEnter(idx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50/70"
                  >
                    <IconGripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-neutral-300 active:cursor-grabbing" />
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-[10px] font-bold text-brand">
                      {idx + 1}
                    </span>
                    <IconFilePdf className="h-4 w-4 flex-shrink-0 text-neutral-300" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-neutral-400">{fmt(item.file.size)}</p>
                    </div>

                    {/* State badge */}
                    {item.uploadState === 'uploading' && (
                      <span className="flex items-center gap-1.5 text-xs text-brand">
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
                        Uploading
                      </span>
                    )}
                    {item.uploadState === 'done' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-brand">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand/10">
                          <IconCheck className="h-2.5 w-2.5" />
                        </span>
                        Ready
                      </span>
                    )}
                    {item.uploadState === 'error' && (
                      <span className="text-xs font-medium text-danger" title={item.error}>
                        Failed
                      </span>
                    )}

                    <button
                      onClick={() => {
                        removeFile(item.id);
                      }}
                      className="ml-1 flex-shrink-0 rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* One-file hint */}
          {files.length === 1 && merge.status === 'idle' && (
            <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              Add at least one more PDF to enable merging.
            </p>
          )}

          {/* Error */}
          {merge.status === 'error' && (
            <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4">
              <IconAlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger-800">Merge failed</p>
                <p className="mt-0.5 text-sm text-danger-600">{merge.message}</p>
              </div>
              <button
                onClick={() => {
                  setMerge({ status: 'idle' });
                }}
                className="text-danger-500 hover:text-danger-700"
              >
                <IconX />
              </button>
            </div>
          )}

          {/* ── Merge button ── */}
          {files.length >= 2 && (
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                void handleMerge();
              }}
            >
              <span className="flex items-center justify-center gap-2">
                Merge {files.length} PDFs
                <IconArrowRight className="h-3.5 w-3.5" />
              </span>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
