import Link from 'next/link';

import { HOME_TOOLS } from './tools-data';

import type { ReactElement } from 'react';

/**
 * Deliberately not the shared SiteNav used by the tool pages: home has no breadcrumbs and, per the
 * P1 Phase B brief, no auth controls of any kind — just the wordmark and direct links to the three
 * tools.
 */
export function HomeHeader(): ReactElement {
  return (
    <header className="border-b border-neutral-200 bg-base">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5" aria-label="Zipply home">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand">
            <svg viewBox="0 0 16 16" fill="white" className="h-4 w-4" aria-hidden>
              <rect x="2" y="2" width="5" height="5" rx="1" opacity="0.9" />
              <rect x="9" y="2" width="5" height="5" rx="1" opacity="0.7" />
              <rect x="2" y="9" width="5" height="5" rx="1" opacity="0.7" />
              <rect x="9" y="9" width="5" height="5" rx="1" opacity="0.5" />
            </svg>
          </span>
          <span className="text-[15px] font-bold tracking-tight text-neutral-950">Zipply</span>
        </Link>

        <nav aria-label="Tools" className="flex items-center gap-0.5 sm:gap-1">
          {HOME_TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="rounded-lg px-2 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 sm:px-3 sm:text-sm"
            >
              {tool.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
