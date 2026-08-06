import { breadcrumbLd, faqLd, hreflangs, softwareApplicationLd } from '@toolforge/seo-kit';

import { QrClient } from './qr-client';
import { IconQr } from '../../components/icons';
import { SiteNav } from '../../components/site-nav';

import type { Metadata } from 'next';
import type { ReactElement } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
const TOOL_PATH = '/qr-generator';

const FAQ_ITEMS = [
  {
    question: 'What can a QR code encode?',
    answer:
      'URLs, plain text, WiFi credentials, contact cards (vCard), email, phone numbers, and SMS.',
  },
  {
    question: 'What dot and corner styles are available?',
    answer:
      'Square, dots, rounded, classy, classy-rounded and smooth dot styles, plus square, dot and rounded corner markers — all rendered client-side.',
  },
  {
    question: 'Can I add my logo inside the QR?',
    answer:
      'Yes — upload a logo in the QR tab. It appears in the centre of the QR. Use H-level error correction for best results.',
  },
  {
    question: 'What is error correction level?',
    answer:
      'H (highest) recovers 30% of damaged data — required when adding a logo. Use L for smaller, denser QR codes.',
  },
  {
    question: 'Are generated QR codes stored?',
    answer:
      'No. QR codes are generated entirely in your browser and never sent to or stored on our servers.',
  },
  {
    question: 'What image formats can I download?',
    answer:
      'PNG at high resolution. If a frame is selected, it is baked into the downloaded image.',
  },
];

export const metadata: Metadata = {
  title: 'QR Code Generator — Custom Styles, Frames & Social Presets',
  description:
    'Free QR code generator with custom dot and corner styles, colour frames, social media colour presets and logo embedding. No sign-up.',
  alternates: {
    canonical: `${BASE_URL}${TOOL_PATH}`,
    languages: Object.fromEntries(
      hreflangs({ baseUrl: BASE_URL, path: TOOL_PATH }).map(({ hreflang, href }) => [
        hreflang,
        href,
      ]),
    ),
  },
};

const appLd = softwareApplicationLd({
  name: 'QR Code Generator — Zipply',
  description: 'Free QR code generator with custom dot styles, colour frames and social presets.',
  url: `${BASE_URL}${TOOL_PATH}`,
  offering: 'free',
  inLanguage: 'en',
});
const faq = faqLd({ questions: FAQ_ITEMS, inLanguage: 'en' });
const crumbs = breadcrumbLd({
  items: [
    { name: 'Home', url: BASE_URL },
    { name: 'QR Generator', url: `${BASE_URL}${TOOL_PATH}` },
  ],
});

export default function QrGeneratorPage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <SiteNav breadcrumbs={[{ label: 'QR Generator' }]} alwaysGlass />

      {/* Tool hero */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-brand-400" />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-brand-500 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]">
              <IconQr className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-xl font-bold text-neutral-950"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  QR Generator
                </h1>
                <span className="rounded-md border border-neutral-100 bg-neutral-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Free
                </span>
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">
                Custom dot styles · colour frames · social presets · instant preview · PNG download
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tool */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <QrClient />

        {/* FAQ */}
        <section className="mt-14 border-t border-neutral-200 pt-10">
          <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-neutral-400">FAQ</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FAQ_ITEMS.map(({ question, answer }) => (
              <div key={question} className="rounded-xl border border-neutral-100 bg-white p-5">
                <dt className="text-sm font-semibold text-neutral-800">{question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-neutral-500">{answer}</dd>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-400">
        Zipply — free file tools · no account required
      </footer>
    </div>
  );
}
