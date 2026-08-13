/**
 * Next.js config.
 *
 * Decisions baked in here are platform-wide:
 *   - `output: 'standalone'`     — slim Docker image; required for self-host
 *   - `transpilePackages`        — internal monorepo packages aren't pre-built
 *   - `reactStrictMode`          — surfaces double-render and effect bugs early
 *   - `experimental.instrumentationHook` — enables OTel preload via instrumentation.ts
 *   - poweredByHeader off        — leaks nothing
 *   - `images.remotePatterns`    — explicit allowlist; never `domains: ['*']`
 *   - `webpack` extensionAlias   — transpiled packages (e.g. @toolforge/ui) use NodeNext-style
 *     `.js`-suffixed relative imports that point at `.ts`/`.tsx` files (works under tsc/Vitest,
 *     which do this remapping natively). Webpack doesn't do it by default, so an unbuilt package
 *     consumed directly from src/ fails to resolve without this alias.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' produces a slim Docker image; disabled locally because
  // Windows symlink permissions cause EPERM during the copy phase.
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  reactStrictMode: true,
  poweredByHeader: false,

  transpilePackages: [
    '@toolforge/design-tokens',
    '@toolforge/i18n',
    '@toolforge/seo-kit',
    '@toolforge/ui',
    '@toolforge/env',
    '@toolforge/telemetry',
    'qrcode',
  ],

  experimental: {
    instrumentationHook: true,
    // Future: typedRoutes once tool pages stabilize.
  },

  images: {
    remotePatterns: [
      // Add the platform's CDN host(s) here once provisioned.
    ],
  },

  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.js', '.ts', '.tsx'],
    };
    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
