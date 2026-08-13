import { cn } from '../../lib/cn.js';

import type { HTMLAttributes, ReactElement } from 'react';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps): ReactElement {
  return (
    <div
      className={cn('rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-sm', className)}
      {...props}
    />
  );
}
