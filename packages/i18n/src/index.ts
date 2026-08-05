/**
 * @toolforge/i18n
 *
 * Locale routing and resolution primitives. Pure utilities only — translation
 * files (catalogs) live with their consumer (apps/web, services that send
 * email, etc.), keyed by the locale codes defined here.
 *
 * The single source of truth for which locales the platform supports.
 * Adding a locale is a deliberate platform-team decision because each one
 * multiplies the SEO surface.
 */

/** Supported BCP-47 locale codes. Order: most-used first. */
export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'de',
  'fr',
  'pt-BR',
  'it',
  'nl',
  'pl',
  'ja',
  'zh-CN',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Fallback chain for a locale. Specific → generic → default.
 *   pt-BR → pt → en
 *   zh-CN → zh → en
 *   en    → en
 */
export function fallbackChain(locale: string): Locale[] {
  const result: Locale[] = [];
  const lowered = locale.toLowerCase();
  for (const supported of SUPPORTED_LOCALES) {
    if (supported.toLowerCase() === lowered) {
      result.push(supported);
      break;
    }
  }
  const dashIdx = lowered.indexOf('-');
  if (dashIdx > 0) {
    const generic = lowered.slice(0, dashIdx);
    const match = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === generic);
    if (match && !result.includes(match)) result.push(match);
  }
  if (!result.includes(DEFAULT_LOCALE)) result.push(DEFAULT_LOCALE);
  return result;
}

/** True when `locale` is one of our supported codes (case-insensitive). */
export function isSupportedLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.some((l) => l.toLowerCase() === locale.toLowerCase());
}

/**
 * Parse the locale segment out of a URL path.
 *   "/en/pdf/merge"    -> { locale: "en", path: "/pdf/merge" }
 *   "/pdf/merge"       -> { locale: null, path: "/pdf/merge" }
 *   "/zh-CN/qr"        -> { locale: "zh-CN", path: "/qr" }
 */
export function splitLocaleFromPath(pathname: string): {
  locale: Locale | null;
  path: string;
} {
  const segments = pathname.split('/');
  const first = segments[1] ?? '';
  if (first && isSupportedLocale(first)) {
    // Preserve the actual cased form from SUPPORTED_LOCALES.
    const canonical =
      SUPPORTED_LOCALES.find((l) => l.toLowerCase() === first.toLowerCase()) ?? DEFAULT_LOCALE;
    return {
      locale: canonical,
      path: '/' + segments.slice(2).join('/'),
    };
  }
  return { locale: null, path: pathname };
}

/**
 * Resolve a preferred locale from an Accept-Language header.
 * Returns the best supported match or DEFAULT_LOCALE.
 */
export function resolveFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const entries = header
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';');
      const q = qPart?.startsWith('q=') ? Number(qPart.slice(2)) : 1;
      return { tag: tag?.trim() ?? '', q: Number.isFinite(q) ? q : 1 };
    })
    .filter((e) => e.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const entry of entries) {
    for (const locale of fallbackChain(entry.tag)) {
      if (isSupportedLocale(locale)) return locale;
    }
  }
  return DEFAULT_LOCALE;
}

/** Build a localized URL path. Default locale is unprefixed. */
export function localizedHref(
  locale: Locale,
  path: string,
  options: { alwaysPrefix?: boolean } = {},
): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE && !options.alwaysPrefix) return clean;
  return `/${locale}${clean === '/' ? '' : clean}`;
}
