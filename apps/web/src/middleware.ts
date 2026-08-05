import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  localizedHref,
  resolveFromAcceptLanguage,
  splitLocaleFromPath,
} from '@toolforge/i18n';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Locale resolution middleware.
 *
 * Rules:
 *   - `/`, `/pdf/...` etc. → resolve preferred locale from Accept-Language;
 *     if default locale wins, serve as-is. If non-default, redirect to
 *     `/<locale>/...`.
 *   - `/<locale>/...` where <locale> is unsupported → 404 path is OK; we let
 *     Next handle it.
 *   - Skip static assets and Next internals.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const { locale } = splitLocaleFromPath(pathname);
  if (locale && isSupportedLocale(locale)) {
    return NextResponse.next();
  }

  const preferred = resolveFromAcceptLanguage(request.headers.get('accept-language'));
  if (preferred === DEFAULT_LOCALE) {
    return NextResponse.next();
  }

  const redirected = request.nextUrl.clone();
  redirected.pathname = localizedHref(preferred, pathname);
  return NextResponse.redirect(redirected);
}

export const config = {
  // Run on everything except static files. Specific exclusions handled in code.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
