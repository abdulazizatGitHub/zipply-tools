import { SUPPORTED_LOCALES, localizedHref } from '@toolforge/i18n';
import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

/**
 * Tool pages registered for sitemap. Each entry maps to a tool slug and
 * the locales it's currently translated for (Phase 2: English only).
 */
const TOOL_PAGES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  availableLocales: typeof SUPPORTED_LOCALES;
}[] = [
  {
    path: '/pdf-merge',
    priority: 0.8,
    changeFrequency: 'weekly',
    availableLocales: ['en'] as unknown as typeof SUPPORTED_LOCALES,
  },
  {
    path: '/pdf-split',
    priority: 0.8,
    changeFrequency: 'weekly',
    availableLocales: ['en'] as unknown as typeof SUPPORTED_LOCALES,
  },
  {
    path: '/qr-generator',
    priority: 0.8,
    changeFrequency: 'weekly',
    availableLocales: ['en'] as unknown as typeof SUPPORTED_LOCALES,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = BASE_URL.replace(/\/$/, '');

  const toolEntries: MetadataRoute.Sitemap = TOOL_PAGES.flatMap(
    ({ path, priority, changeFrequency, availableLocales }) =>
      (availableLocales as readonly string[]).map((locale) => ({
        url: `${base}${localizedHref(locale as (typeof SUPPORTED_LOCALES)[number], path)}`,
        priority,
        changeFrequency,
        // hreflang alternate links for each locale variant
        alternates: {
          languages: Object.fromEntries(
            (availableLocales as readonly string[]).map((loc) => [
              loc,
              `${base}${localizedHref(loc as (typeof SUPPORTED_LOCALES)[number], path)}`,
            ]),
          ),
        },
      })),
  );

  return [
    {
      url: `${base}/`,
      priority: 1.0,
      changeFrequency: 'daily',
    },
    ...toolEntries,
  ];
}
