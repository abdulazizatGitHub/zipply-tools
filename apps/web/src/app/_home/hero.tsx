import { IconClock, IconLaptop, IconShield } from '../../components/icons';

import type { ReactElement } from 'react';

const TRUST_FACTS = [
  { Icon: IconShield, text: 'No account required' },
  { Icon: IconClock, text: 'Files deleted within the hour' },
  { Icon: IconLaptop, text: 'QR codes never leave your browser' },
] as const;

export function Hero(): ReactElement {
  return (
    <section className="bg-base px-6 pb-16 pt-20 sm:pb-20 sm:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand sm:text-5xl">
          Free file tools that don&apos;t get in your way.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-600">
          No account, no watermarks, no daily limits. Merge PDFs, split PDFs, or generate a QR code
          — then your files are gone within the hour.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {TRUST_FACTS.map(({ Icon, text }) => (
            <span key={text} className="flex items-center gap-2 text-sm text-neutral-500">
              <Icon className="h-4 w-4 text-brand" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
