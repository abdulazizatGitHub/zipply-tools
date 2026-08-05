import { breadcrumbLd, faqLd, hreflangs, softwareApplicationLd } from '@toolforge/seo-kit';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { SiteNav } from '../../components/site-nav';
import { IconMerge, IconSplit } from '../../components/icons';
import { PdfMergeClient } from './pdf-merge-client';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
const TOOL_PATH = '/pdf-merge';

const FAQ_ITEMS = [
  {
    question: 'How many PDFs can I merge?',
    answer: 'Up to 20 files, with a combined size limit of 50 MB.',
  },
  {
    question: 'Are my files stored permanently?',
    answer: 'No. Files and results are deleted automatically within 1 hour.',
  },
  {
    question: 'Can I reorder the files before merging?',
    answer: 'Yes — drag rows in the file list to set the final page order.',
  },
  { question: 'Is this tool free?', answer: 'Completely free, no account required.' },
];

export const metadata: Metadata = {
  title: 'Merge PDFs Online',
  description: 'Combine PDFs in your browser. Free, fast, private. Files auto-delete after 1 hour.',
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
  name: 'PDF Merge — Zipply',
  description: 'Combine PDFs in your browser. Free, fast, private.',
  url: `${BASE_URL}${TOOL_PATH}`,
  offering: 'free',
  inLanguage: 'en',
});
const faq = faqLd({ questions: FAQ_ITEMS, inLanguage: 'en' });
const crumbs = breadcrumbLd({
  items: [
    { name: 'Home', url: BASE_URL },
    { name: 'PDF Merge', url: `${BASE_URL}${TOOL_PATH}` },
  ],
});

export default function PdfMergePage(): ReactElement {
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

      <SiteNav breadcrumbs={[{ label: 'PDF Merge' }]} alwaysGlass />

      {/* ── Tool hero strip ── */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-[0_4px_14px_rgba(47,95,230,0.35)]">
              <IconMerge className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-xl font-bold text-neutral-950"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  PDF Merge
                </h1>
                <span className="rounded-md border border-neutral-100 bg-neutral-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Free
                </span>
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">
                Combine multiple PDFs into one file. Upload in order, reorder by dragging, then
                download.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Tool widget */}
          <div className="min-w-0">
            <PdfMergeClient
              apiBase={process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}
              pdfServiceBase={
                process.env.NEXT_PUBLIC_PDF_SERVICE_BASE_URL ?? 'http://localhost:8081'
              }
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* How to use */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
                How to use
              </h2>
              <ol className="space-y-3">
                {[
                  'Drop or browse your PDF files',
                  'Drag to set merge order',
                  'Click Merge and download',
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-neutral-600">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Limits */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Limits
              </h2>
              <dl className="space-y-2 text-sm">
                {[
                  ['Max files', '20 PDFs'],
                  ['Max total size', '50 MB'],
                  ['Retention', '1 hour'],
                  ['Cost', 'Free'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-neutral-500">{label}</dt>
                    <dd className="font-semibold text-neutral-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Related tool */}
            <a
              href="/pdf-split"
              className="glow-hover flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <IconSplit className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-800">PDF Split</p>
                <p className="text-xs text-neutral-400">Extract or separate pages</p>
              </div>
              <IconSplit className="ml-auto h-3.5 w-3.5 text-neutral-300" />
            </a>
          </aside>
        </div>

        {/* FAQ */}
        <section className="mt-14 border-t border-neutral-200 pt-10">
          <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-neutral-400">FAQ</h2>
          <div className="grid gap-5 sm:grid-cols-2">
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
