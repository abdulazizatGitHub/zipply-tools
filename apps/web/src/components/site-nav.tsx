'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

interface Crumb {
  label: string;
  href?: string;
}

interface SiteNavProps {
  /** Pass breadcrumbs on tool pages to render the secondary trail. */
  breadcrumbs?: Crumb[];
  /** Force the dark-glass style even at the top (tool pages). Default: auto on scroll. */
  alwaysGlass?: boolean;
}

export function SiteNav({ breadcrumbs, alwaysGlass }: SiteNavProps): ReactElement {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const isGlass = alwaysGlass ?? scrolled;

  return (
    <header
      className={[
        'sticky top-0 z-50 w-full transition-all duration-300',
        isGlass
          ? 'border-b border-white/[0.06] bg-neutral-950/90 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl'
          : 'border-b border-transparent bg-neutral-950',
      ].join(' ')}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Wordmark */}
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Zipply home">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500 shadow-[0_0_12px_rgba(74,124,255,0.4)]">
            <svg viewBox="0 0 16 16" fill="white" className="h-4 w-4" aria-hidden>
              <rect x="2" y="2" width="5" height="5" rx="1" opacity="0.9" />
              <rect x="9" y="2" width="5" height="5" rx="1" opacity="0.7" />
              <rect x="2" y="9" width="5" height="5" rx="1" opacity="0.7" />
              <rect x="9" y="9" width="5" height="5" rx="1" opacity="0.5" />
            </svg>
          </span>
          <span
            className="text-[15px] font-bold tracking-tight text-white transition-opacity group-hover:opacity-80"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Zipply
          </span>
        </Link>

        {/* Right */}
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100"
          >
            All tools
          </Link>
        </nav>
      </div>

      {/* Breadcrumb strip — tool pages only */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-t border-white/[0.04] bg-neutral-900/50">
          <nav
            className="mx-auto flex h-9 max-w-6xl items-center gap-1.5 px-6"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="text-xs text-neutral-600 transition-colors hover:text-neutral-400"
            >
              Home
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <svg
                  viewBox="0 0 6 10"
                  className="h-2.5 w-1.5 text-neutral-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs font-medium text-neutral-300">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
