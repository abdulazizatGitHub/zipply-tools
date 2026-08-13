import { cn } from '../../lib/cn.js';

import type { ReactElement } from 'react';

export type StepStatus = 'upcoming' | 'current' | 'complete';

export interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

function stepStatus(index: number, currentStep: number): StepStatus {
  if (index < currentStep) return 'complete';
  if (index === currentStep) return 'current';
  return 'upcoming';
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps): ReactElement {
  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const status = stepStatus(index, currentStep);

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <span
              data-state={status}
              className={cn(
                'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                status === 'current' && 'bg-brand text-neutral-0',
                status === 'complete' && 'bg-brand/20 text-brand',
                status === 'upcoming' && 'bg-neutral-100 text-neutral-400',
              )}
            >
              {status === 'complete' ? (
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
                index + 1
              )}
            </span>
            <span
              className={cn(
                'ml-2 whitespace-nowrap text-xs font-medium',
                status === 'current' && 'text-neutral-900',
                status === 'complete' && 'text-brand',
                status === 'upcoming' && 'text-neutral-400',
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-3 h-px flex-1',
                  status === 'complete' ? 'bg-brand/40' : 'bg-neutral-200',
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
