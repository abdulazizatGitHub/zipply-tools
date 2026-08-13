import { Card } from '@toolforge/ui';
import Link from 'next/link';

import { HOME_TOOLS } from './tools-data';
import { IconArrowRight } from '../../components/icons';

import type { ReactElement } from 'react';

export function ToolCards(): ReactElement {
  return (
    <section className="bg-base px-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 sm:grid-cols-3">
          {HOME_TOOLS.map(({ id, href, name, tagline, Icon }) => (
            <Link
              key={id}
              href={href}
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-lg font-bold text-neutral-950">{name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{tagline}</p>
                <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Open tool
                  <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
