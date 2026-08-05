# @toolforge/seo-engine

SEO engine — programmatic SEO at scale (tools × locales × variants = hundreds of thousands of
indexable pages).

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Owns:** sitemap index + chunked sitemaps, hreflang chains, canonical resolution, structured-data
assembly per tool manifest, freshness signals.

**Primitives:** `@toolforge/seo-kit` (pure helpers). This service is the runtime that composes them.

**Failure mode awareness:** thin/duplicate content kills rankings. Programmatic ≠ thin — every
variant page must add unique content; quality bar is enforced server-side.
