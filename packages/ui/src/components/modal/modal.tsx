'use client';

import { useEffect } from 'react';

import { cn } from '../../lib/cn.js';

import type { ReactElement, ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps): ReactElement | null {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4">
      {/* Full-bleed native button behind the panel gives click-to-dismiss a built-in keyboard
          equivalent for free, instead of a non-interactive div with a manual onClick. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn('relative w-full max-w-md rounded-2xl bg-neutral-0 p-6 shadow-xl', className)}
      >
        {title ? <h2 className="mb-4 text-lg font-bold text-neutral-900">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
