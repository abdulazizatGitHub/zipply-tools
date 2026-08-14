import { Card } from '@toolforge/ui';
import Link from 'next/link';

import type { ComponentType, ReactElement } from 'react';

export interface NumberedStepsCardProps {
  title?: string;
  steps: string[];
}

export function NumberedStepsCard({
  title = 'How to use',
  steps,
}: NumberedStepsCardProps): ReactElement {
  return (
    <Card>
      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">{title}</h2>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
              {index + 1}
            </span>
            <span className="text-sm text-neutral-600">{step}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export interface KeyValueCardProps {
  title?: string;
  items: [string, string][];
}

export function KeyValueCard({ title = 'Limits', items }: KeyValueCardProps): ReactElement {
  return (
    <Card>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">{title}</h2>
      <dl className="space-y-2 text-sm">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="font-semibold text-neutral-800">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export interface RelatedToolCardProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  name: string;
  tagline: string;
}

export function RelatedToolCard({
  href,
  icon: Icon,
  name,
  tagline,
}: RelatedToolCardProps): ReactElement {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-800">{name}</p>
        <p className="text-xs text-neutral-400">{tagline}</p>
      </div>
    </Link>
  );
}
