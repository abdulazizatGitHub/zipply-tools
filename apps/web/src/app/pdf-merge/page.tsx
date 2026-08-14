import { breadcrumbLd, faqLd, hreflangs, softwareApplicationLd } from '@toolforge/seo-kit';

import { PdfMergeClient } from './pdf-merge-client';
import { IconMerge, IconSplit } from '../../components/icons';
import { SiteNav } from '../../components/site-nav';
import { ToolFaqSection } from '../../components/tool-faq-section';
import { ToolHeroStrip } from '../../components/tool-hero-strip';
import { ToolPageFooter } from '../../components/tool-page-footer';
import { KeyValueCard, NumberedStepsCard, RelatedToolCard } from '../../components/tool-sidebar';

import type { Metadata } from 'next';
import type { ReactElement } from 'react';

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

      <ToolHeroStrip
        icon={IconMerge}
        title="PDF Merge"
        description="Combine multiple PDFs into one file. Upload in order, reorder by dragging, then download."
      />

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
          <aside className="hidden space-y-6 lg:block">
            <NumberedStepsCard
              steps={[
                'Drop or browse your PDF files',
                'Drag to set merge order',
                'Click Merge and download',
              ]}
            />
            <KeyValueCard
              items={[
                ['Max files', '20 PDFs'],
                ['Max total size', '50 MB'],
                ['Retention', '1 hour'],
                ['Cost', 'Free'],
              ]}
            />
            <RelatedToolCard
              href="/pdf-split"
              icon={IconSplit}
              name="PDF Split"
              tagline="Extract or separate pages"
            />
          </aside>
        </div>

        <ToolFaqSection items={FAQ_ITEMS} />
      </main>

      <ToolPageFooter />
    </div>
  );
}
