/**
 * @toolforge/design-tokens
 *
 * Single source of truth for the platform's visual system. Tokens are
 * declared once here and consumed everywhere via:
 *   - JS/TS imports (this entry)            for runtime use
 *   - `/tailwind` subpath                   for `tailwind.config` extend
 *   - `/css` subpath (built tokens.css)     for CSS-only consumers
 *
 * Mandate: NO hardcoded colors, type sizes, or spacing values anywhere else
 * in the codebase. Enforced via ESLint rules in Phase 2 once the canonical
 * palette stabilizes.
 */

export const colors = {
  // Brand
  //
  // `DEFAULT` is the frozen Penn Blue primary (see DECISIONS.md ADR-004) — the single navy accent
  // used across the whole product going forward, with no per-tool variants. It is additive only:
  // the 50-900 scale below is still the pre-ADR-004 emerald palette, actively rendered by every
  // live page today via shaded classes (`bg-brand-600`, etc). Migrating the scale itself to Penn
  // Blue is tracked as remaining P1 scope in NEXT_STEPS.md — do not do it inside this token change
  // without also updating every page that consumes a shaded `brand-*` class in the same pass.
  brand: {
    DEFAULT: '#141E5A',
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // Neutral
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  // Semantic
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    500: '#16a34a',
    600: '#15803d',
    700: '#166534',
    800: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    500: '#d97706',
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
  },
  // `DEFAULT` is the frozen destructive/error accent (see DECISIONS.md ADR-004) — use it ONLY for
  // destructive and error UI, never as a brand accent. Additive only; the 50-800 scale below is
  // pre-existing and unrelated to this decision.
  danger: {
    DEFAULT: '#fa2d14',
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    500: '#dc2626',
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    500: '#0284c7',
    600: '#0369a1',
    700: '#1d4ed8',
    800: '#1e40af',
  },
  // Base / page background (see DECISIONS.md ADR-004) — warm off-white, exposed to Tailwind as
  // `bg-base` only (see tailwind.ts): it's intentionally NOT part of the shared `colors` scale
  // consumed by `text-*`/`border-*` utilities, because a `base` key there would collide with
  // Tailwind's built-in `text-base` font-size utility, which live pages already use.
  base: {
    DEFAULT: '#F8F5F1',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
} as const;

export const radii = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
} as const;

export const motion = {
  duration: {
    fast: '120ms',
    base: '200ms',
    slow: '320ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  motion,
  breakpoints,
} as const;

export type Tokens = typeof tokens;
