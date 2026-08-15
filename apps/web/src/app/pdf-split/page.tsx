import { breadcrumbLd, faqLd, hreflangs, softwareApplicationLd } from '@toolforge/seo-kit';

import { PdfSplitClient } from './pdf-split-client';
import { SiteNav } from '../../components/site-nav';
import { ToolFaqSection } from '../../components/tool-faq-section';
import { ToolPageFooter } from '../../components/tool-page-footer';

import type { Metadata } from 'next';
import type { ReactElement } from 'react';

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
    <div className="flex min-h-screen flex-col bg-base">
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

      <SiteNav />

      {/* ── Main layout — single column, one continuous base surface, no boxed hero band.
          The client widens itself to a two-panel layout only in its populated (tile + controls)
          state — see pdf-split-client.tsx. ── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-neutral-950 sm:text-3xl">PDF Split</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Upload a PDF and split it by page range, or extract every page as its own file.
          </p>
        </div>

        <div className="mt-10">
          <PdfSplitClient
            apiBase={process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}
            pdfServiceBase={process.env.NEXT_PUBLIC_PDF_SERVICE_BASE_URL ?? 'http://localhost:8081'}
          />
        </div>

        <ToolFaqSection items={FAQ_ITEMS} />
      </main>

      <ToolPageFooter />
    </div>
  );
}
