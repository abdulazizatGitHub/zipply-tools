import { breadcrumbLd, faqLd, hreflangs, softwareApplicationLd } from '@toolforge/seo-kit';
import { isSupportedLocale, localizedHref, type Locale } from '@toolforge/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';

import { PdfMergeClient } from '../../pdf-merge/pdf-merge-client';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
const TOOL_PATH = '/pdf-merge';

const FAQ_ITEMS = [
  {
    question: 'How many PDFs can I merge?',
    answer: 'Up to 20 files, with a combined size limit of 50 MB.',
  },
  {
    question: 'Are my files stored permanently?',
    answer: 'No. Uploaded files and the merged result are deleted automatically within 1 hour.',
  },
  {
    question: 'Can I reorder the files before merging?',
    answer: 'Yes — drag and drop files in the order you want them to appear in the final PDF.',
  },
  {
    question: 'Is this tool free?',
    answer: 'Yes, completely free with no account required.',
  },
];

interface Props {
  params: { locale: string };
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isSupportedLocale(params.locale)) return {};
  const locale: Locale = params.locale;
  const base = BASE_URL.replace(/\/$/, '');
  return {
    title: 'Merge PDFs Online',
    description:
      'Combine PDFs in your browser. Free, fast, private. Files auto-delete after 1 hour.',
    alternates: {
      canonical: `${base}${localizedHref(locale, TOOL_PATH)}`,
      languages: Object.fromEntries(
        hreflangs({ baseUrl: base, path: TOOL_PATH }).map(({ hreflang, href }) => [hreflang, href]),
      ),
    },
  };
}

export default function LocalePdfMergePage({ params }: Props): ReactElement {
  if (!isSupportedLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const base = BASE_URL.replace(/\/$/, '');

  const appLd = softwareApplicationLd({
    name: 'PDF Merge — Zipply',
    description:
      'Combine PDFs in your browser. Free, fast, private. Files auto-delete after 1 hour.',
    url: `${base}${localizedHref(locale, TOOL_PATH)}`,
    offering: 'free',
    inLanguage: locale,
  });

  const faq = faqLd({ questions: FAQ_ITEMS, inLanguage: locale });

  const breadcrumb = breadcrumbLd({
    items: [
      { name: 'Home', url: `${base}${localizedHref(locale, '/')}` },
      { name: 'PDF Merge', url: `${base}${localizedHref(locale, TOOL_PATH)}` },
    ],
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Structured data */}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Nav */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <a
            href={localizedHref(locale, '/')}
            className="text-xl font-bold tracking-tight text-neutral-900 hover:text-brand-700"
          >
            Zipply
          </a>
          <span className="text-sm text-neutral-500">PDF Tools</span>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2">
            <a
              href={localizedHref(locale, '/')}
              className="text-sm text-neutral-500 hover:text-brand-600"
            >
              Home
            </a>
            <span className="text-neutral-300">/</span>
            <span className="text-sm font-medium text-neutral-700">PDF Merge</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Merge PDFs</h1>
          <p className="mt-2 text-neutral-600">
            Upload PDF files in merge order, then download the combined result. Files are kept for 1
            hour then automatically deleted.
          </p>
        </div>

        {/* Interactive merge widget — same client component, locale-aware API base */}
        <PdfMergeClient
          apiBase={process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}
          pdfServiceBase={process.env.NEXT_PUBLIC_PDF_SERVICE_BASE_URL ?? 'http://localhost:8081'}
        />

        {/* FAQ */}
        <section className="mt-16 border-t border-neutral-200 pt-10">
          <h2 className="mb-6 text-lg font-semibold text-neutral-900">
            Frequently asked questions
          </h2>
          <dl className="space-y-5">
            {FAQ_ITEMS.map(({ question, answer }) => (
              <div key={question}>
                <dt className="font-medium text-neutral-900">{question}</dt>
                <dd className="mt-1 text-sm text-neutral-600">{answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
