import { cn } from '../../lib/cn.js';

import type { HTMLAttributes, ReactElement } from 'react';

export type BadgeVariant = 'brand' | 'neutral' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  brand: 'bg-brand/10 text-brand',
  neutral: 'bg-neutral-100 text-neutral-700',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
