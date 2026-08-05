/**
 * @toolforge/seo-kit
 *
 * Programmatic SEO primitives. The platform renders tens to hundreds of
 * thousands of tool landing pages across locales; that scale requires a
 * declarative kit, not per-page hand-tuning.
 *
 * Functions are pure (no I/O) and return plain data — frameworks render
 * them. This lets us use the same code from Next.js `generateMetadata`,
 * sitemap routes, the seo-engine service, and tests.
 */

import { SUPPORTED_LOCALES, DEFAULT_LOCALE, localizedHref, type Locale } from '@toolforge/i18n';

// ---------------------------------------------------------------------------
// Canonical & hreflang
// ---------------------------------------------------------------------------

export interface CanonicalInput {
  baseUrl: string; // e.g. "https://toolforge.example"
  path: string; // e.g. "/pdf/merge"
  locale: Locale;
}

export function canonical({ baseUrl, path, locale }: CanonicalInput): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return `${trimmed}${localizedHref(locale, path)}`;
}

export interface HreflangEntry {
  hreflang: string; // BCP-47 code or "x-default"
  href: string;
}

/** Build hreflang entries for every supported locale + x-default. */
export function hreflangs(input: {
  baseUrl: string;
  path: string;
  /** Locales the page is actually translated for. Others are dropped. */
  availableLocales?: readonly Locale[];
}): HreflangEntry[] {
  const trimmed = input.baseUrl.replace(/\/$/, '');
  const available = input.availableLocales ?? SUPPORTED_LOCALES;
  const entries: HreflangEntry[] = available.map((loc) => ({
    hreflang: loc,
    href: `${trimmed}${localizedHref(loc, input.path)}`,
  }));
  // x-default points at the default locale's URL.
  entries.push({
    hreflang: 'x-default',
    href: `${trimmed}${localizedHref(DEFAULT_LOCALE, input.path)}`,
  });
  return entries;
}

// ---------------------------------------------------------------------------
// JSON-LD builders
// ---------------------------------------------------------------------------

export interface SoftwareApplicationLdInput {
  name: string;
  description: string;
  url: string;
  /** "FreeTool" | "FreemiumTool" — drives offer block. */
  offering?: 'free' | 'freemium' | 'paid';
  aggregateRating?: { ratingValue: number; ratingCount: number };
  inLanguage: Locale;
}

export function softwareApplicationLd(input: SoftwareApplicationLdInput): Record<string, unknown> {
  const offer =
    input.offering && input.offering !== 'paid'
      ? {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        }
      : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: input.inLanguage,
    ...(offer ? { offers: offer } : {}),
    ...(input.aggregateRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.aggregateRating.ratingValue,
            ratingCount: input.aggregateRating.ratingCount,
          },
        }
      : {}),
  };
}

export interface FaqLdInput {
  questions: { question: string; answer: string }[];
  inLanguage: Locale;
}

export function faqLd(input: FaqLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: input.inLanguage,
    mainEntity: input.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export interface BreadcrumbLdInput {
  items: { name: string; url: string }[];
}

export function breadcrumbLd(input: BreadcrumbLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: input.items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------------------------------------------------------------------------
// Sitemap helpers
// ---------------------------------------------------------------------------

export interface SitemapEntry {
  loc: string;
  lastmod?: string; // ISO date
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number; // 0.0 to 1.0
  alternates?: HreflangEntry[];
}

/**
 * Render a sitemap.xml body from entries. Caller is responsible for
 * splitting into <50_000-entry chunks and emitting a sitemap index.
 */
export function renderSitemapXml(entries: readonly SitemapEntry[]): string {
  const escape = (s: string): string =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const urls = entries
    .map((entry) => {
      const parts = [`    <loc>${escape(entry.loc)}</loc>`];
      if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (typeof entry.priority === 'number')
        parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      const alts = (entry.alternates ?? [])
        .map(
          (a) =>
            `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escape(a.href)}"/>`,
        )
        .join('\n');
      return ['  <url>', parts.join('\n'), alts, '  </url>'].filter(Boolean).join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    '</urlset>',
  ].join('\n');
}
