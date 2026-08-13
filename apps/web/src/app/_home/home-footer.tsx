import Link from 'next/link';

import { HOME_TOOLS } from './tools-data';

import type { ReactElement } from 'react';

export function HomeFooter(): ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Zipply</p>
          <p className="mt-1 text-sm text-white/70">
            Free file tools. No account, no watermarks, no catch.
          </p>
        </div>

        <nav aria-label="Tools" className="flex flex-wrap gap-x-6 gap-y-2">
          {HOME_TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="text-sm text-white/80 transition-colors hover:text-white"
            >
              {tool.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-white/15 pt-6">
        <p className="text-xs text-white/60">
          © {year} Zipply. All rights reserved. Proprietary and confidential. Licensing:{' '}
          <a href="mailto:abdulwork058@gmail.com" className="underline hover:text-white">
            abdulwork058@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
