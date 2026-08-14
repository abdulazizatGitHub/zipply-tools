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
  IconX,
} from '../../components/icons';

import type { DragEvent, ReactElement } from 'react';

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

/** Which screen is showing — independent of merge.status so "back" can set the result aside
 *  without discarding it, and can step to a blank upload view without discarding the file list. */
type ViewStep = 'upload' | 'merge' | 'done';

const STEPS = ['Upload files', 'Merge', 'Download'];

/* Local, unexported icons — kept out of the shared components/icons.tsx for this checkpoint so the
 * diff stays confined to this file (see the P1 Phase C4 task scope). */
function IconArrowLeft({ className = 'h-4 w-4' }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/* Generic cloud glyph — no Google Drive/Dropbox brand mark is available in this project and adding
 * one means either a new icon-library dependency or vendoring brand assets, neither in scope here.
 * The button's label/tooltip/text carry the "which service" meaning, not the icon. */
function IconCloud({ className = 'h-4 w-4' }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M17.5 19H9a5 5 0 1 1 .29-9.99A7 7 0 0 1 21 12.5a4.5 4.5 0 0 1-3.5 6.5z" />
    </svg>
  );
}

/* A future cloud-import source — reads as a live navy control turned down, not a dead/broken grey
 * one. The circle fill is a navy tint (bg-brand/20), but the icon and label stay full-strength
 * text-brand — a "dimmed navy" button, not a desaturated one — so it's unmistakably a Zipply
 * feature, just not built yet. The "Soon" badge (kept neutral, off the navy family) is the honesty
 * signal on top of native disabled + aria-disabled + a tooltip. No onClick — nothing to do yet. */
function CloudImportButton({ label, tooltip }: { label: string; tooltip: string }): ReactElement {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={tooltip}
        aria-label={tooltip}
        className="relative flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full bg-brand/20 text-brand"
      >
        <IconCloud className="h-6 w-6" />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-200 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-neutral-500">
          Soon
        </span>
      </button>
      <span className="text-xs font-medium text-brand">{label}</span>
    </div>
  );
}

export function PdfMergeClient({
  apiBase,
  pdfServiceBase,
}: {
  apiBase: string;
  pdfServiceBase: string;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [merge, setMerge] = useState<MergeState>({ status: 'idle' });
  const [viewStep, setViewStep] = useState<ViewStep>('upload');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);

  const currentStep = viewStep === 'upload' ? 0 : viewStep === 'merge' ? 1 : 2;

  const addFiles = (incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfs.length) return;
    setFiles((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ id: crypto.randomUUID(), file: f, uploadState: 'pending' as const })),
    ]);
    if (merge.status !== 'idle') setMerge({ status: 'idle' });
    setViewStep('merge');
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
      setViewStep('done');
    } catch (err) {
      setMerge({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  };

  /* Pure client-state navigation — no fetch, no re-upload, no re-merge. Just changes which step
   * renders from state already held in this component. */
  const goBack = () => {
    if (viewStep === 'done') {
      setMerge({ status: 'idle' }); // set the result aside; files are untouched
      setViewStep('merge');
    } else if (viewStep === 'merge') {
      setViewStep('upload');
    }
  };

  const fmt = (n: number) =>
    n < 1_048_576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1_048_576).toFixed(2)} MB`;
  const totalSize = files.reduce((s, f) => s + f.file.size, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {viewStep !== 'upload' && merge.status !== 'merging' && (
          <button
            type="button"
            onClick={goBack}
            className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-brand"
          >
            <IconArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        )}
        <StepIndicator steps={STEPS} currentStep={currentStep} className="flex-1" />
      </div>

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
      ) : viewStep === 'done' && merge.status === 'done' ? (
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

          <p className="mt-6 text-xs text-neutral-400">
            File will be automatically deleted within 1 hour
          </p>
        </ResultPanel>
      ) : (
        <>
          {/* ── Drop zone (dominant, primary) + a slim secondary "import from" column ──
              Row on larger screens, stacked (column below) on narrow ones. */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
            <DropZone
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              className="flex-1 p-14 sm:p-20"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
                {files.length ? (
                  <IconPlus className="h-7 w-7 text-brand" />
                ) : (
                  <IconFilePdf className="h-7 w-7 text-brand" />
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
                <p className="mt-1.5 text-xs text-neutral-400">
                  Up to 20 files · 50 MB · PDF only · Free · deleted in 1 hour
                </p>
              </div>
            </DropZone>

            {/* Secondary — future cloud-import sources, honestly pending, never competing with
                device upload for attention. Row of two on narrow screens (below the dropzone),
                a slim stacked column beside it on larger ones. */}
            <div className="flex flex-col items-center gap-4 sm:w-28 sm:flex-shrink-0 sm:items-start sm:justify-center">
              <p className="text-center text-xs text-neutral-400 sm:text-left">Or import from</p>
              <div className="flex flex-row gap-6 sm:flex-col sm:gap-5">
                <CloudImportButton label="Drive" tooltip="Google Drive — coming soon" />
                <CloudImportButton label="Dropbox" tooltip="Dropbox — coming soon" />
              </div>
            </div>
          </div>

          {/* ── File list — only in the merge (populated) view ── */}
          {viewStep === 'merge' && files.length > 0 && (
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
          {viewStep === 'merge' && files.length === 1 && merge.status === 'idle' && (
            <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              Add at least one more PDF to enable merging.
            </p>
          )}

          {/* Error */}
          {viewStep === 'merge' && merge.status === 'error' && (
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
          {viewStep === 'merge' && files.length >= 2 && (
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
