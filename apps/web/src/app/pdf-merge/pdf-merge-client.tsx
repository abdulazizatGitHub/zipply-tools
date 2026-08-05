'use client';
/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */

import { useCallback, useRef, useState } from 'react';

import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconCheckCircle,
  IconDownload,
  IconFilePdf,
  IconGripVertical,
  IconPlus,
  IconSplit,
  IconX,
} from '../../components/icons';
import { StepIndicator } from '../../components/step-indicator';

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

const STEPS = [{ label: 'Upload files' }, { label: 'Merge' }, { label: 'Download' }];

export function PdfMergeClient({
  apiBase,
  pdfServiceBase,
}: {
  apiBase: string;
  pdfServiceBase: string;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
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

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
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
      {/* Step indicator */}
      <StepIndicator steps={STEPS} current={currentStep} />

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

      {/* ── Drop zone ── */}
      {merge.status !== 'done' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => {
            setDragOver(false);
          }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Upload PDF files"
          className={[
            'group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 p-12 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            dragOver
              ? 'dropzone-active scale-[1.01]'
              : files.length
                ? 'border-neutral-200 bg-neutral-50 hover:border-brand-300 hover:bg-white'
                : 'border-neutral-300 bg-white hover:border-brand-300',
          ].join(' ')}
        >
          {/* Background illustration */}
          {!files.length && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
              <svg viewBox="0 0 200 160" className="h-full w-full" fill="currentColor">
                <rect x="20" y="20" width="60" height="80" rx="4" className="text-brand-600" />
                <rect
                  x="90"
                  y="10"
                  width="60"
                  height="80"
                  rx="4"
                  className="text-brand-600"
                  opacity=".6"
                />
                <rect
                  x="120"
                  y="30"
                  width="60"
                  height="80"
                  rx="4"
                  className="text-brand-600"
                  opacity=".3"
                />
                <path
                  d="M50 120 Q100 140 150 120"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="6 4"
                  className="text-brand-400"
                />
              </svg>
            </div>
          )}

          {/* Upload icon */}
          <div
            className={[
              'relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300',
              dragOver ? 'bg-brand-100 scale-110' : 'bg-neutral-100 group-hover:bg-brand-50',
            ].join(' ')}
          >
            {dragOver && (
              <span className="animate-pulse-ring absolute h-full w-full rounded-2xl bg-brand-400 opacity-30" />
            )}
            {files.length ? (
              <IconPlus
                className={`h-6 w-6 transition-colors ${dragOver ? 'text-brand-600' : 'text-neutral-500 group-hover:text-brand-600'}`}
              />
            ) : (
              <IconFilePdf
                className={`h-6 w-6 transition-colors ${dragOver ? 'text-brand-600' : 'text-neutral-500 group-hover:text-brand-600'}`}
              />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-700">
              {dragOver ? (
                'Release to add files'
              ) : files.length ? (
                <>
                  Add more PDFs, or <span className="text-brand-600">browse</span>
                </>
              ) : (
                <>
                  Drop PDF files here, or <span className="text-brand-600">browse</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-neutral-400">Up to 20 files · 50 MB total · PDF only</p>
          </div>
        </div>
      )}

      {/* ── File list ── */}
      {files.length > 0 && merge.status !== 'done' && (
        <div className="animate-fade-in overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
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
                className="animate-slide-in flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50/70"
                style={{ animationDelay: `${String(idx * 40)}ms` }}
              >
                <IconGripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-neutral-300 active:cursor-grabbing" />
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-600">
                  {idx + 1}
                </span>
                <IconFilePdf className="h-4 w-4 flex-shrink-0 text-neutral-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{item.file.name}</p>
                  <p className="text-xs text-neutral-400">{fmt(item.file.size)}</p>
                </div>

                {/* State badge */}
                {item.uploadState === 'uploading' && (
                  <span className="flex items-center gap-1.5 text-xs text-brand-500">
                    <span className="inline-block h-3.5 w-3.5 animate-spin-smooth rounded-full border-2 border-brand-100 border-t-brand-500" />
                    Uploading
                  </span>
                )}
                {item.uploadState === 'done' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
                      <IconCheck className="h-2.5 w-2.5" />
                    </span>
                    Ready
                  </span>
                )}
                {item.uploadState === 'error' && (
                  <span className="text-xs font-medium text-red-500" title={item.error}>
                    Failed
                  </span>
                )}

                <button
                  onClick={() => {
                    removeFile(item.id);
                  }}
                  className="ml-1 flex-shrink-0 rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-400"
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
        <p className="animate-fade-in rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Add at least one more PDF to enable merging.
        </p>
      )}

      {/* Error */}
      {merge.status === 'error' && (
        <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Merge failed</p>
            <p className="mt-0.5 text-sm text-red-600">{merge.message}</p>
          </div>
          <button
            onClick={() => {
              setMerge({ status: 'idle' });
            }}
            className="text-red-400 hover:text-red-600"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* ── Merge button ── */}
      {files.length >= 2 && merge.status !== 'done' && (
        <button
          onClick={() => {
            void handleMerge();
          }}
          disabled={merge.status === 'merging'}
          className="group w-full rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(47,95,230,0.30)] transition-all hover:bg-brand-500 hover:shadow-[0_4px_20px_rgba(47,95,230,0.40)] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {merge.status === 'merging' ? (
            <span className="flex items-center justify-center gap-2.5">
              <span className="inline-block h-4 w-4 animate-spin-smooth rounded-full border-2 border-white/25 border-t-white" />
              Merging {files.length} PDFs…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Merge {files.length} PDFs
              <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </button>
      )}

      {/* ── Success ── */}
      {merge.status === 'done' && (
        <div className="animate-scale-in overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {/* Animated progress bar at top */}
          <div className="h-1 w-full overflow-hidden bg-neutral-100">
            <div className="animate-progress h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500" />
          </div>

          <div className="px-8 py-8 text-center">
            {/* Success icon with bounce */}
            <div className="mb-5 flex justify-center">
              <span className="animate-bounce-in flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
                <IconCheckCircle className="h-8 w-8" />
              </span>
            </div>

            <h2
              className="text-xl font-bold text-neutral-950"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Merge complete!
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              {merge.pageCount} pages · {fmt(merge.sizeBytes)} · ready to download
            </p>

            {/* Download CTA */}
            <a
              href={merge.downloadUrl}
              download="merged.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(47,95,230,0.30)] transition-all hover:bg-brand-500 hover:shadow-[0_4px_20px_rgba(47,95,230,0.40)]"
            >
              <IconDownload className="h-4 w-4" />
              Download merged.pdf
            </a>

            {/* Secondary actions */}
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
                className="flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-brand-600"
              >
                <IconSplit className="h-3.5 w-3.5" /> Try PDF Split
              </a>
            </div>
          </div>

          <div className="border-t border-neutral-100 bg-neutral-50/60 px-6 py-3 text-center text-xs text-neutral-400">
            File will be automatically deleted within 1 hour
          </div>
        </div>
      )}
    </div>
  );
}
