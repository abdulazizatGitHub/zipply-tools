import { cn } from '../../lib/cn.js';

import type { ReactElement } from 'react';

export interface ProcessingPanelProps {
  label: string;
  className?: string;
}

export function ProcessingPanel({ label, className }: ProcessingPanelProps): ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-12 text-center shadow-sm',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
      />
      <p className="text-sm font-medium text-neutral-600">{label}</p>
    </div>
  );
}
