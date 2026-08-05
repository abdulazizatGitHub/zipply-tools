import type { ReactElement } from 'react';

export interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  /** 0-based index of the current active step */
  current: number;
}

/**
 * Horizontal step indicator for tool pages.
 * Shows numbered circles connected by a line — completed steps are filled,
 * active step is outlined + pulsing, future steps are grey.
 */
export function StepIndicator({ steps, current }: StepIndicatorProps): ReactElement {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const future = i > current;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  done ? 'bg-brand-600 text-white' : '',
                  active
                    ? 'border-2 border-brand-500 bg-brand-50 text-brand-600 shadow-[0_0_0_4px_rgba(47,95,230,0.12)]'
                    : '',
                  future ? 'border-2 border-neutral-200 bg-white text-neutral-400' : '',
                ].join(' ')}
              >
                {done ? (
                  <svg
                    viewBox="0 0 10 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                    aria-hidden
                  >
                    <polyline points="1 4 3.5 6.5 9 1" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={[
                  'text-[11px] font-medium whitespace-nowrap',
                  done ? 'text-brand-600' : '',
                  active ? 'text-neutral-800' : '',
                  future ? 'text-neutral-400' : '',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line — not after last step */}
            {!isLast && (
              <div className="relative mx-2 mb-5 h-[2px] flex-1">
                <div className="absolute inset-0 rounded-full bg-neutral-200" />
                {done && (
                  <div className="absolute inset-0 rounded-full bg-brand-500 transition-all duration-500" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
