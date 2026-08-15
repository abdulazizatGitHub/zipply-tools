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
  IconX,
} from '../../components/icons';

import type { DragEvent, MouseEvent, ReactElement } from 'react';

interface SplitPart {
  fileId: string;
  downloadUrl: string;
  label: string;
  pageCount: number;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';
type InspectState = 'idle' | 'loading' | 'done' | 'error';
type SplitMode = 'all' | 'custom';
type SplitState =
  | { status: 'idle' }
  | { status: 'splitting' }
  | { status: 'done'; parts: SplitPart[]; sourcePageCount: number }
  | { status: 'error'; message: string };

/** Which screen is showing — independent of split.status so "back" can leave a result behind
 *  without discarding it, and step to a blank upload view without discarding the picked file. */
type ViewStep = 'upload' | 'split' | 'done';

const STEPS = ['Upload', 'Configure', 'Download'];

/* Local, unexported icons — kept out of the shared components/icons.tsx, matching the exact
 * pattern established in pdf-merge-client.tsx, so the diff stays confined to this file. */
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

/**
 * Compact a set of 1-indexed page numbers into a range string, merging
 * consecutive pages: {1,2,3,5,7,8} -> "1-3,5,7-8".
 */
function compactPagesToRangeString(pages: Set<number>): string {
  const sorted = Array.from(pages).sort((a, b) => a - b);
  if (sorted.length === 0) return '';

  const parts: string[] = [];
  let rangeStart = sorted[0] ?? 0;
  let rangeEnd = rangeStart;

  for (let i = 1; i < sorted.length; i++) {
    const page = sorted[i] ?? rangeEnd;
    if (page === rangeEnd + 1) {
      rangeEnd = page;
      continue;
    }
    parts.push(
      rangeStart === rangeEnd ? String(rangeStart) : `${String(rangeStart)}-${String(rangeEnd)}`,
    );
    rangeStart = page;
    rangeEnd = page;
  }
  parts.push(
    rangeStart === rangeEnd ? String(rangeStart) : `${String(rangeStart)}-${String(rangeEnd)}`,
  );
  return parts.join(',');
}

/**
 * Parse a typed range string into the set of pages it selects, mirroring the
 * server's own range semantics exactly (services/pdf-service pdf-split
 * handler's parseRange): a reversed range ("3-1") is rejected outright (not
 * normalized), a too-high range end is clamped to totalPages, an
 * out-of-range single page is dropped, and non-numeric tokens are ignored.
 * Never throws — unparseable tokens are silently skipped.
 */
function parsePagesFromRangeString(input: string, totalPages: number): Set<number> {
  const result = new Set<number>();
  const tokens = input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const dashIdx = token.indexOf('-');
    if (dashIdx > 0) {
      const start = parseInt(token.slice(0, dashIdx), 10);
      const end = parseInt(token.slice(dashIdx + 1), 10);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) continue;
      const clampedEnd = Math.min(end, totalPages);
      for (let p = start; p <= clampedEnd; p++) result.add(p);
    } else {
      const page = parseInt(token, 10);
      if (!Number.isFinite(page) || page < 1 || page > totalPages) continue;
      result.add(page);
    }
  }
  return result;
}

const fmt = (n: number) =>
  n < 1_048_576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1_048_576).toFixed(2)} MB`;

export function PdfSplitClient({
  apiBase,
  pdfServiceBase,
}: {
  apiBase: string;
  pdfServiceBase: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [inspectState, setInspectState] = useState<InspectState>('idle');
  const [mode, setMode] = useState<SplitMode>('all');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [ranges, setRanges] = useState('');
  const [split, setSplit] = useState<SplitState>({ status: 'idle' });
  const [viewStep, setViewStep] = useState<ViewStep>('upload');
  const [showRangeError, setShowRangeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const lastClickedTile = useRef<number | null>(null);

  const currentStep = viewStep === 'upload' ? 0 : viewStep === 'split' ? 1 : 2;

  const upload = async (f: File): Promise<string> => {
    setUploadState('uploading');
    const res = await fetch(`${pdfServiceBase}/v1/_dev/files`, {
      method: 'POST',
      headers: { 'content-type': 'application/pdf' },
      body: f,
    });
    if (!res.ok) throw new Error(`Upload failed (${String(res.status)})`);
    const data = (await res.json()) as { fileId: string };
    setFileId(data.fileId);
    setUploadState('done');
    return data.fileId;
  };

  const inspect = async (id: string): Promise<void> => {
    setInspectState('loading');
    try {
      const res = await fetch(`${apiBase}/v1/tools/pdf-inspect/execute`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: { fileId: id } }),
      });
      if (!res.ok) throw new Error('inspect failed');
      const data = (await res.json()) as { output: { pageCount: number } };
      setPageCount(data.output.pageCount);
      setInspectState('done');
    } catch {
      setInspectState('error');
    }
  };

  const beginUploadAndInspect = (f: File) => {
    void (async () => {
      try {
        const id = await upload(f);
        await inspect(id);
      } catch {
        setUploadState('error');
      }
    })();
  };

  const pickFile = (f: File) => {
    if (!f.name.endsWith('.pdf') && f.type !== 'application/pdf') return;
    setFile(f);
    setFileId(null);
    setUploadState('idle');
    setPageCount(null);
    setInspectState('idle');
    setSplit({ status: 'idle' });
    setRanges('');
    setSelectedPages(new Set());
    lastClickedTile.current = null;
    setMode('all');
    setShowRangeError(false);
    setViewStep('split');
    beginUploadAndInspect(f);
  };

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  /* Tile -> range field. Single click toggles that page; shift-click selects a contiguous run
   * from the last-clicked tile. Every click recomputes the compact range string from the
   * resulting page set — the field never free-drifts out of sync with the tiles. */
  const handleTileClick = (page: number, event: MouseEvent<HTMLButtonElement>) => {
    // Snapshot before scheduling the update — setSelectedPages's updater callback can run after
    // this function has already returned, by which point the ref below would have been
    // overwritten to `page` itself, collapsing every shift-click range to a single tile.
    const previousTile = lastClickedTile.current;
    setShowRangeError(false);
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (event.shiftKey && previousTile !== null) {
        const lo = Math.min(previousTile, page);
        const hi = Math.max(previousTile, page);
        for (let p = lo; p <= hi; p++) next.add(p);
      } else if (next.has(page)) {
        next.delete(page);
      } else {
        next.add(page);
      }
      setRanges(compactPagesToRangeString(next));
      return next;
    });
    lastClickedTile.current = page;
  };

  /* Range field -> tiles. Parsed on every keystroke. An empty field clears the tile selection;
   * an unparseable-but-non-empty value (mid-typing, e.g. "1-") leaves the tiles exactly as they
   * were rather than flashing them empty — the field itself always shows exactly what was typed. */
  const handleRangesInput = (value: string) => {
    setRanges(value);
    setShowRangeError(false);
    if (value.trim() === '') {
      setSelectedPages(new Set());
      return;
    }
    if (pageCount === null) return;
    const parsed = parsePagesFromRangeString(value, pageCount);
    if (parsed.size > 0) setSelectedPages(parsed);
  };

  const selectAllMode = () => {
    setMode('all');
    setShowRangeError(false);
  };

  const selectCustomMode = () => {
    setMode('custom');
    setShowRangeError(false);
    setTimeout(() => {
      rangeRef.current?.focus();
    }, 60);
  };

  const handleSplit = async () => {
    if (!file) return;
    if (mode === 'custom' && ranges.trim().length === 0) {
      setShowRangeError(true);
      return;
    }
    setShowRangeError(false);
    setSplit({ status: 'splitting' });
    try {
      const id = fileId ?? (await upload(file));
      const parsedRanges =
        mode === 'custom'
          ? ranges
              .split(',')
              .map((r) => r.trim())
              .filter(Boolean)
          : [];

      const res = await fetch(`${apiBase}/v1/tools/pdf-split/execute`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: { fileId: id, ...(parsedRanges.length && { ranges: parsedRanges }) },
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail ?? `Split failed (${String(res.status)})`);
      }
      const data = (await res.json()) as {
        output: { parts: SplitPart[]; sourcePageCount: number };
      };
      setSplit({
        status: 'done',
        parts: data.output.parts,
        sourcePageCount: data.output.sourcePageCount,
      });
      setViewStep('done');
    } catch (err) {
      setSplit({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  };

  const reset = () => {
    setFile(null);
    setFileId(null);
    setUploadState('idle');
    setPageCount(null);
    setInspectState('idle');
    setMode('all');
    setRanges('');
    setSelectedPages(new Set());
    lastClickedTile.current = null;
    setShowRangeError(false);
    setSplit({ status: 'idle' });
    setViewStep('upload');
  };

  /* Pure client-state navigation — no fetch, no re-upload, no re-split. The picked file and its
   * configuration are retained even after stepping back; only which screen renders changes. */
  const goBack = () => {
    if (viewStep === 'done') {
      setSplit({ status: 'idle' });
      setViewStep('split');
    } else if (viewStep === 'split') {
      setViewStep('upload');
    }
  };

  const resolvedUrl = (part: SplitPart) =>
    part.downloadUrl.startsWith('http') ? part.downloadUrl : `${pdfServiceBase}${part.downloadUrl}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        {viewStep !== 'upload' && split.status !== 'splitting' && (
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

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pickFile(f);
        }}
      />

      <div className="mt-6">
        {split.status === 'splitting' ? (
          <ProcessingPanel label="Splitting your PDF…" />
        ) : viewStep === 'done' && split.status === 'done' ? (
          <ResultPanel
            heading="Split complete!"
            subtext={`Your PDF has been split into ${String(split.parts.length)} part${split.parts.length !== 1 ? 's' : ''}.`}
          >
            <ul className="space-y-2 text-left">
              {split.parts.map((part, idx) => (
                <li
                  key={part.fileId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-0 px-4 py-3"
                >
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                    Part {idx + 1} · {part.label} · {part.pageCount} page
                    {part.pageCount !== 1 ? 's' : ''}
                  </p>
                  <a
                    href={resolvedUrl(part)}
                    download={`split-${part.label.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-0 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
                  >
                    <IconDownload className="h-3.5 w-3.5" />
                    Download
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={reset}
              className="mt-6 text-sm font-medium text-neutral-500 transition-colors hover:text-brand hover:underline"
            >
              Split another file
            </button>

            <p className="mt-3 text-xs text-neutral-400">
              Files will be automatically deleted within 1 hour
            </p>
          </ResultPanel>
        ) : viewStep === 'upload' ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
            <DropZone
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              className="flex-1 p-14 sm:p-20"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
                <IconFilePdf className="h-7 w-7 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-700">
                  Drop a PDF here, or <span className="text-brand">browse</span>
                </p>
                <p className="mt-1.5 text-xs text-neutral-400">
                  Up to 1 file · 50 MB · PDF only · Free · deleted in 1 hour
                </p>
              </div>
            </DropZone>

            <div className="flex flex-col items-center gap-4 sm:w-28 sm:flex-shrink-0 sm:items-start sm:justify-center">
              <p className="text-center text-xs text-neutral-400 sm:text-left">Or import from</p>
              <div className="flex flex-row gap-6 sm:flex-col sm:gap-5">
                <CloudImportButton label="Drive" tooltip="Google Drive — coming soon" />
                <CloudImportButton label="Dropbox" tooltip="Dropbox — coming soon" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── File info ── */}
            {file && (
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-0 px-3 py-2.5 shadow-sm">
                <IconFilePdf className="h-4 w-4 flex-shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-neutral-900">{file.name}</p>
                  <p className="text-[11px] text-neutral-400">
                    {fmt(file.size)}
                    {uploadState === 'done' && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 font-medium text-brand">
                        <IconCheck className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Remove file"
                  className="rounded-lg p-1 text-neutral-300 transition-colors hover:bg-danger-50 hover:text-danger-500"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ── Mode toggle — small pill, not large cards ── */}
            <div className="inline-flex items-center gap-1 rounded-full bg-neutral-100 p-1">
              <button
                type="button"
                aria-pressed={mode === 'all'}
                onClick={selectAllMode}
                className={[
                  'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                  mode === 'all'
                    ? 'bg-brand text-neutral-0'
                    : 'text-neutral-600 hover:bg-neutral-200',
                ].join(' ')}
              >
                All pages
              </button>
              <button
                type="button"
                aria-pressed={mode === 'custom'}
                onClick={selectCustomMode}
                className={[
                  'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                  mode === 'custom'
                    ? 'bg-brand text-neutral-0'
                    : 'text-neutral-600 hover:bg-neutral-200',
                ].join(' ')}
              >
                Custom ranges
              </button>
            </div>

            {/* ── Mode content ── */}
            {mode === 'all' ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-0 p-6 text-center shadow-sm">
                {pageCount === null ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
                    Reading page count…
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-neutral-800">
                      All {pageCount} pages will become separate files.
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">One PDF per page.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-0 p-4 shadow-sm">
                  {uploadState === 'error' ? (
                    <div className="p-2 text-xs text-danger-600">
                      Upload failed.{' '}
                      <button
                        type="button"
                        onClick={() => {
                          if (file) beginUploadAndInspect(file);
                        }}
                        className="font-semibold underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : inspectState === 'error' ? (
                    <p className="p-2 text-xs text-danger-600">Couldn&apos;t read page count.</p>
                  ) : inspectState !== 'done' || pageCount === null ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-xs text-neutral-400">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
                      Reading pages…
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => {
                        const selected = selectedPages.has(page);
                        return (
                          <button
                            key={page}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`Page ${String(page)}${selected ? ', selected' : ''}`}
                            onClick={(e) => {
                              handleTileClick(page, e);
                            }}
                            className={[
                              'flex h-14 w-12 flex-shrink-0 items-center justify-center rounded-md border text-sm transition-colors',
                              selected
                                ? 'border-brand bg-brand/15 font-semibold text-brand'
                                : 'border-neutral-200 bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
                            ].join(' ')}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="range-input"
                    className="block text-xs font-semibold uppercase tracking-widest text-neutral-500"
                  >
                    Page ranges
                  </label>
                  <input
                    id="range-input"
                    ref={rangeRef}
                    type="text"
                    value={ranges}
                    onChange={(e) => {
                      handleRangesInput(e.target.value);
                    }}
                    placeholder="1-3, 5"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-sm text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand focus:bg-neutral-0 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <p className="text-xs text-neutral-400">e.g. 1-3, 5, 7-9</p>
                </div>
              </div>
            )}

            {split.status === 'error' && (
              <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4">
                <IconAlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-danger-800">Split failed</p>
                  <p className="mt-0.5 text-sm text-danger-600">{split.message}</p>
                </div>
                <button
                  onClick={() => {
                    setSplit({ status: 'idle' });
                  }}
                  className="text-danger-500 hover:text-danger-700"
                >
                  <IconX />
                </button>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                void handleSplit();
              }}
            >
              <span className="flex items-center justify-center gap-2">
                Split PDF
                <IconArrowRight className="h-3.5 w-3.5" />
              </span>
            </Button>

            {showRangeError && (
              <p className="text-center text-xs font-medium text-danger-600">
                Please select at least one page range.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
