// Import directly from source — Tailwind config runs in Node under PostCSS,
// not through webpack, so transpilePackages doesn't apply here. The built
// dist/tailwind.js is the same content; pointing to src avoids the subpath
// export resolution edge case on first build (before dist/ exists).
import { tailwindTokens } from '../../packages/design-tokens/src/tailwind.js';
import type { Config } from 'tailwindcss';

/**
 * Tailwind config consumes shared tokens. Apps NEVER redefine color/type/
 * spacing scales — they extend or compose. Enforce via design-system reviews.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: tailwindTokens,
  },
  plugins: [],
};

export default config;
