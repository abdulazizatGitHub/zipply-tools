import type { ReactElement } from 'react';

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolFaqSectionProps {
  items: ToolFaqItem[];
  /** Grid columns at the lg breakpoint — 2 (PDF tools) or 3 (QR, which has more FAQ items). */
  columns?: 2 | 3;
}

export function ToolFaqSection({ items, columns = 2 }: ToolFaqSectionProps): ReactElement {
  return (
    <section className="mt-14 border-t border-neutral-200 pt-10">
      <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-neutral-400">FAQ</h2>
      <div className={`grid gap-5 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : ''}`}>
        {items.map(({ question, answer }) => (
          <div key={question} className="rounded-xl border border-neutral-100 bg-neutral-0 p-5">
            <dt className="text-sm font-semibold text-neutral-800">{question}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-neutral-500">{answer}</dd>
          </div>
        ))}
      </div>
    </section>
  );
}
