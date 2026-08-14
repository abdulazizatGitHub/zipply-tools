import { Badge } from '@toolforge/ui';

import type { ComponentType, ReactElement } from 'react';

export interface ToolHeroStripProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  /** Constrains the inner content width to match the page's own main-content container. */
  maxWidthClassName?: string;
}

/**
 * Shared identity band at the top of every tool page: navy accent bar, icon, title, "Free" tag,
 * and a one-line description. Identical across tools save for icon/copy/width — see DECISIONS.md
 * / P1 Phase C survey for why this was extracted.
 */
export function ToolHeroStrip({
  icon: Icon,
  title,
  description,
  maxWidthClassName = 'max-w-5xl',
}: ToolHeroStripProps): ReactElement {
  return (
    <div className="border-b border-neutral-200 bg-neutral-0">
      <div className="h-1 w-full bg-brand" />
      <div className={`mx-auto ${maxWidthClassName} px-6 py-8`}>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand text-neutral-0 shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-950">{title}</h1>
              <Badge variant="neutral">Free</Badge>
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
