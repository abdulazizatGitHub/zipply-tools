import { cn } from '../../lib/cn.js';

import type { ReactElement } from 'react';

export interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps): ReactElement {
  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const state = isCurrent ? 'current' : isComplete ? 'complete' : 'upcoming';

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <span
              data-state={state}
              className={cn(
                'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                isCurrent && 'bg-brand text-neutral-0',
                isComplete && !isCurrent && 'bg-brand/20 text-brand',
                !isCurrent && !isComplete && 'bg-neutral-100 text-neutral-400',
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                'ml-2 whitespace-nowrap text-xs font-medium',
                isCurrent ? 'text-neutral-900' : 'text-neutral-400',
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="mx-3 h-px flex-1 bg-neutral-200" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
