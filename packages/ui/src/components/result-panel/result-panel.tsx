import { cn } from '../../lib/cn.js';

import type { ReactElement, ReactNode } from 'react';

export interface ResultPanelProps {
  heading: string;
  subtext?: string;
  /** CTA(s) and secondary actions — e.g. a download control, a "start over" link. */
  children?: ReactNode;
  className?: string;
}

export function ResultPanel({
  heading,
  subtext,
  children,
  className,
}: ResultPanelProps): ReactElement {
  return (
    <div
      role="status"
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0 shadow-sm',
        className,
      )}
    >
      <div className="px-8 py-8 text-center">
        <div className="mb-5 flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand ring-8 ring-brand/5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </div>

        <h2 className="text-xl font-bold text-neutral-950">{heading}</h2>
        {subtext ? <p className="mt-1.5 text-sm text-neutral-500">{subtext}</p> : null}

        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}
