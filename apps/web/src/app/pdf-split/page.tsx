import { breadcrumbLd, faqLd, hreflangs, softwareApplicationLd } from '@toolforge/seo-kit';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { SiteNav } from '../../components/site-nav';
import { IconMerge, IconSplit } from '../../components/icons';
import { PdfSplitClient } from './pdf-split-client';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
const TOOL_PATH = '/pdf-split';

const FAQ_ITEMS = [
  {
    question: 'How do I split a PDF into specific pages?',
    answer:
      'Upload your PDF, choose "Custom ranges", then enter ranges like "1-3, 4-6". Each becomes its own file.',
  },
  {
    question: 'Can I extract just one page?',
    answer: 'Yes — enter a single page number like "5" to extract exactly that page.',
  },
  {
    question: 'What if I leave the ranges empty?',
    answer: 'The PDF is split into individual pages — one file per page, up to 30 pages.',
  },
  {
    question: 'Are my files stored permanently?',
    answer: 'No. Files are automatically deleted within 1 hour.',
  },
];

export const metadata: Metadata = {
  title: 'Split PDF Online',
  description:
    'Split a PDF into separate files by page range. Free, fast, private. Files auto-delete after 1 hour.',
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
  name: 'PDF Split — Zipply',
  description: 'Split a PDF into separate files by page range. Free, fast, private.',
  url: `${BASE_URL}${TOOL_PATH}`,
  offering: 'free',
  inLanguage: 'en',
});
const faq = faqLd({ questions: FAQ_ITEMS, inLanguage: 'en' });
const crumbs = breadcrumbLd({
  items: [
    { name: 'Home', url: BASE_URL },
    { name: 'PDF Split', url: `${BASE_URL}${TOOL_PATH}` },
  ],
});

export default function PdfSplitPage(): ReactElement {
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

      <SiteNav breadcrumbs={[{ label: 'PDF Split' }]} alwaysGlass />

      {/* ── Tool hero strip ── */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]">
              <IconSplit className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-xl font-bold text-neutral-950"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  PDF Split
                </h1>
                <span className="rounded-md border border-neutral-100 bg-neutral-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Free
                </span>
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">
                Upload a PDF and split it by page range, or extract every page as its own file.
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
            <PdfSplitClient
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
                  'Upload your PDF file',
                  'Choose: all pages or custom ranges',
                  'Click Split and download each part',
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-neutral-600">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Range format guide */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Range format
              </h2>
              <ul className="space-y-2">
                {[
                  { ex: '1-3', desc: 'Pages 1 to 3' },
                  { ex: '5', desc: 'Just page 5' },
                  { ex: '1-3, 7', desc: 'Two parts' },
                ].map(({ ex, desc }) => (
                  <li key={ex} className="flex items-center justify-between">
                    <code className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-700">
                      {ex}
                    </code>
                    <span className="text-xs text-neutral-400">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Limits */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Limits
              </h2>
              <dl className="space-y-2 text-sm">
                {[
                  ['Max file size', '50 MB'],
                  ['Max parts', '30'],
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

            {/* Related */}
            <a
              href="/pdf-merge"
              className="glow-hover flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <IconMerge className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-800">PDF Merge</p>
                <p className="text-xs text-neutral-400">Combine multiple PDFs into one</p>
              </div>
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
