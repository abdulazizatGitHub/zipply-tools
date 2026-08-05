'use client';
/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */

import { useRef, useState } from 'react';

import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconCheckCircle,
  IconDownload,
  IconFilePdf,
  IconMerge,
  IconUpload,
  IconX,
} from '../../components/icons';
import { StepIndicator } from '../../components/step-indicator';

interface SplitPart {
  fileId: string;
  downloadUrl: string;
  label: string;
  pageCount: number;
}

type UploadState = 'idle' | 'uploading' | 'done';
type SplitMode = 'all' | 'custom';
type SplitState =
  | { status: 'idle' }
  | { status: 'splitting' }
  | { status: 'done'; parts: SplitPart[]; sourcePageCount: number }
  | { status: 'error'; message: string };

const STEPS = [{ label: 'Upload' }, { label: 'Configure' }, { label: 'Download' }];
const RANGE_CHIPS = ['1', '1-3', '4-6', '7-10'];

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
  const [mode, setMode] = useState<SplitMode>('all');
  const [ranges, setRanges] = useState('');
  const [split, setSplit] = useState<SplitState>({ status: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);

  const currentStep = split.status === 'done' ? 2 : split.status === 'splitting' ? 1 : file ? 1 : 0;

  const pickFile = (f: File) => {
    if (!f.name.endsWith('.pdf') && f.type !== 'application/pdf') return;
    setFile(f);
    setFileId(null);
    setUploadState('idle');
    setSplit({ status: 'idle' });
    setRanges('');
    setMode('all');
  };

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

  const appendChip = (chip: string) => {
    setRanges((prev) => {
      const t = prev.trim();
      return t ? `${t}, ${chip}` : chip;
    });
    rangeRef.current?.focus();
  };

  const handleSplit = async () => {
    if (!file) return;
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
    setRanges('');
    setMode('all');
    setSplit({ status: 'idle' });
  };

  const resolvedUrl = (part: SplitPart) =>
    part.downloadUrl.startsWith('http') ? part.downloadUrl : `${pdfServiceBase}${part.downloadUrl}`;

  const canSplit = !!file && (mode === 'all' || ranges.trim().length > 0);

  return (
    <div className="space-y-5">
      <StepIndicator steps={STEPS} current={currentStep} />

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

      {/* ── Drop zone ── */}
      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => {
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) pickFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Upload a PDF file"
          className={[
            'group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 p-14 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            dragOver
              ? 'dropzone-active scale-[1.01]'
              : 'border-neutral-300 bg-white hover:border-brand-300',
          ].join(' ')}
        >
          {/* Background illustration */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.025]">
            <svg viewBox="0 0 180 160" className="h-full w-full" fill="none">
              <rect x="30" y="20" width="120" height="140" rx="6" fill="#7c3aed" />
              <line x1="50" y1="65" x2="130" y2="65" stroke="white" strokeWidth="3" />
              <line x1="50" y1="85" x2="130" y2="85" stroke="white" strokeWidth="3" opacity=".6" />
              <line x1="50" y1="105" x2="90" y2="105" stroke="white" strokeWidth="3" opacity=".4" />
              <path d="M80 140 L90 155 L100 140" fill="white" opacity=".7" />
            </svg>
          </div>

          <div
            className={[
              'relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300',
              dragOver ? 'bg-violet-100 scale-110' : 'bg-neutral-100 group-hover:bg-violet-50',
            ].join(' ')}
          >
            {dragOver && (
              <span className="animate-pulse-ring absolute h-full w-full rounded-2xl bg-violet-400 opacity-30" />
            )}
            <IconUpload
              className={`h-6 w-6 transition-colors ${dragOver ? 'text-violet-600' : 'text-neutral-500 group-hover:text-violet-600'}`}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-700">
              {dragOver ? (
                'Release to upload'
              ) : (
                <>
                  Drop a PDF here, or <span className="text-brand-600">browse</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-neutral-400">Single PDF · up to 50 MB</p>
          </div>
        </div>
      )}

      {/* ── File card ── */}
      {file && split.status !== 'done' && (
        <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-sm">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <IconFilePdf className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">{file.name}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {(file.size / 1_048_576).toFixed(2)} MB
              {uploadState === 'uploading' && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-brand-500">
                  <span className="inline-block h-3 w-3 animate-spin-smooth rounded-full border-2 border-brand-100 border-t-brand-500" />
                  Uploading…
                </span>
              )}
              {uploadState === 'done' && (
                <span className="ml-2 inline-flex items-center gap-1 font-medium text-emerald-600">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100">
                    <IconCheck className="h-2 w-2" />
                  </span>
                  Uploaded
                </span>
              )}
            </p>
          </div>
          <button
            onClick={reset}
            className="rounded-lg p-2 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-400"
            aria-label="Remove file"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Mode selector ── */}
      {file && split.status !== 'done' && (
        <div className="animate-fade-in rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
            How do you want to split?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* All pages */}
            <button
              type="button"
              onClick={() => {
                setMode('all');
              }}
              className={[
                'flex flex-col items-start gap-2.5 rounded-xl border-2 p-4 text-left transition-all',
                mode === 'all'
                  ? 'border-brand-500 bg-brand-50 shadow-[0_0_0_3px_rgba(47,95,230,0.08)]'
                  : 'border-neutral-200 bg-white hover:border-brand-200 hover:bg-neutral-50',
              ].join(' ')}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${mode === 'all' ? 'bg-brand-100 text-brand-600' : 'bg-neutral-100 text-neutral-500'}`}
              >
                <IconFilePdf className="h-4 w-4" />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${mode === 'all' ? 'text-brand-700' : 'text-neutral-800'}`}
                >
                  All pages
                </p>
                <p className="text-xs text-neutral-400">One file per page</p>
              </div>
            </button>

            {/* Custom ranges */}
            <button
              type="button"
              onClick={() => {
                setMode('custom');
                setTimeout(() => {
                  rangeRef.current?.focus();
                }, 60);
              }}
              className={[
                'flex flex-col items-start gap-2.5 rounded-xl border-2 p-4 text-left transition-all',
                mode === 'custom'
                  ? 'border-violet-500 bg-violet-50 shadow-[0_0_0_3px_rgba(124,58,237,0.08)]'
                  : 'border-neutral-200 bg-white hover:border-violet-200 hover:bg-neutral-50',
              ].join(' ')}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${mode === 'custom' ? 'bg-violet-100 text-violet-600' : 'bg-neutral-100 text-neutral-500'}`}
              >
                {/* Range icon */}
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <line x1="2" y1="4" x2="14" y2="4" />
                  <line x1="2" y1="8" x2="8" y2="8" />
                  <line x1="2" y1="12" x2="11" y2="12" />
                </svg>
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${mode === 'custom' ? 'text-violet-700' : 'text-neutral-800'}`}
                >
                  Custom ranges
                </p>
                <p className="text-xs text-neutral-400">You define the parts</p>
              </div>
            </button>
          </div>

          {/* Range input */}
          {mode === 'custom' && (
            <div className="animate-fade-up mt-4 space-y-3">
              <div>
                <label
                  htmlFor="range-input"
                  className="mb-2 block text-xs font-semibold uppercase tracking-widest text-neutral-500"
                >
                  Page ranges
                </label>
                <input
                  id="range-input"
                  ref={rangeRef}
                  type="text"
                  value={ranges}
                  onChange={(e) => {
                    setRanges(e.target.value);
                  }}
                  placeholder="e.g.  1-3, 4-6, 7"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-sm text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400">Add:</span>
                {RANGE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      appendChip(chip);
                    }}
                    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 font-mono text-xs font-medium text-neutral-600 transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400">
                Comma-separated.{' '}
                <code className="rounded bg-neutral-100 px-1 font-mono text-[11px] text-neutral-600">
                  1-3
                </code>{' '}
                = range,{' '}
                <code className="rounded bg-neutral-100 px-1 font-mono text-[11px] text-neutral-600">
                  5
                </code>{' '}
                = single page. Numbered from 1. Max 30 parts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {split.status === 'error' && (
        <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Split failed</p>
            <p className="mt-0.5 text-sm text-red-600">{split.message}</p>
          </div>
          <button
            onClick={() => {
              setSplit({ status: 'idle' });
            }}
            className="text-red-400 hover:text-red-600"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* ── Split button ── */}
      {file && split.status !== 'done' && (
        <button
          onClick={() => {
            void handleSplit();
          }}
          disabled={!canSplit || split.status === 'splitting'}
          className="group w-full rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(47,95,230,0.30)] transition-all hover:bg-brand-500 hover:shadow-[0_4px_20px_rgba(47,95,230,0.40)] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {split.status === 'splitting' ? (
            <span className="flex items-center justify-center gap-2.5">
              <span className="inline-block h-4 w-4 animate-spin-smooth rounded-full border-2 border-white/25 border-t-white" />
              Splitting PDF…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {mode === 'all' ? 'Split into individual pages' : 'Split PDF'}
              <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </button>
      )}

      {/* ── Results ── */}
      {split.status === 'done' && (
        <div className="animate-scale-in overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 overflow-hidden bg-neutral-100">
            <div className="animate-progress h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/60 px-5 py-4">
            <span className="animate-bounce-in flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <IconCheckCircle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-neutral-900">
                {split.parts.length} part{split.parts.length !== 1 ? 's' : ''} ready
              </p>
              <p className="text-xs text-neutral-400">
                Source: {split.sourcePageCount} page{split.sourcePageCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={reset}
              className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              Split another
            </button>
          </div>

          {/* Parts */}
          <ul className="divide-y divide-neutral-100">
            {split.parts.map((part, idx) => (
              <li
                key={part.fileId}
                className="animate-slide-in flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50"
                style={{ animationDelay: `${String(idx * 40)}ms` }}
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-bold text-brand-600">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{part.label}</p>
                  <p className="text-xs text-neutral-400">
                    {part.pageCount} page{part.pageCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <a
                  href={resolvedUrl(part)}
                  download={`split-${part.label.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-500 hover:shadow-[0_2px_8px_rgba(47,95,230,0.30)]"
                >
                  <IconDownload className="h-3.5 w-3.5" />
                  Download
                </a>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/60 px-5 py-3">
            <p className="text-xs text-neutral-400">Files deleted in 1 hour</p>
            <a
              href="/pdf-merge"
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              <IconMerge className="h-3 w-3" /> Try PDF Merge
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
