'use client';

import { useState } from 'react';

import { cn } from '../../lib/cn.js';

import type { DragEvent, ReactElement, ReactNode } from 'react';

export interface DropZoneProps {
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  /** Controlled override for the active/drag-over visual state — mainly for composition and tests. */
  active?: boolean;
  className?: string;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  /** Makes the zone clickable (e.g. to open a file picker), adding button semantics and keyboard support. */
  onClick?: () => void;
  /** Custom content (e.g. an icon plus rich copy) instead of the default label/hint text. */
  children?: ReactNode;
}

export function DropZone({
  label = 'Drop files here',
  hint,
  disabled = false,
  active,
  className,
  onDrop,
  onClick,
  children,
}: DropZoneProps): ReactElement {
  const [internalActive, setInternalActive] = useState(false);
  const isActive = active ?? internalActive;
  const clickable = Boolean(onClick) && !disabled;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-disabled={disabled}
      data-state={isActive ? 'active' : 'idle'}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setInternalActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (!disabled) setInternalActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (disabled) return;
        setInternalActive(false);
        onDrop?.(event);
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
        clickable && 'cursor-pointer',
        disabled
          ? 'border-neutral-200 bg-neutral-50 text-neutral-400'
          : 'border-neutral-300 text-neutral-600',
        isActive && !disabled && 'border-brand bg-brand/5 text-brand',
        className,
      )}
    >
      {children ?? (
        <>
          <span className="text-sm font-semibold">{label}</span>
          {hint ? <span className="text-xs text-neutral-400">{hint}</span> : null}
        </>
      )}
    </div>
  );
}
