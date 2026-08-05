import { isSupportedLocale } from '@toolforge/i18n';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';

/**
 * Per-locale home. Foundation phase only — Phase 2 expands into the full
 * locale-routed tree (tools, categories, marketing pages).
 */
export default function LocaleHomePage({ params }: { params: { locale: string } }): ReactElement {
  if (!isSupportedLocale(params.locale)) notFound();
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Zipply</h1>
      <p className="mt-4 text-lg text-neutral-600">Locale: {params.locale}</p>
    </main>
  );
}
