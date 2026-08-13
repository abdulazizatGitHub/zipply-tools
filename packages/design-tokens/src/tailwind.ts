/**
 * Tailwind extension. Apps consume via:
 *
 *   import { tailwindTokens } from '@toolforge/design-tokens/tailwind';
 *   export default { theme: { extend: tailwindTokens } };
 *
 * Keeps Tailwind config in apps trivial and ensures one place to change
 * the visual system.
 */

import { colors, typography, spacing, radii, motion, breakpoints } from './index.js';

export const tailwindTokens = {
  colors: {
    brand: { ...colors.brand },
    neutral: { ...colors.neutral },
    success: { ...colors.success },
    warning: { ...colors.warning },
    danger: { ...colors.danger },
    info: { ...colors.info },
  },
  // `base` (page background, ADR-004) is deliberately scoped to backgroundColor only, not the
  // shared `colors` map above — putting it there would also generate a `text-base` color utility
  // that collides with Tailwind's built-in `text-base` font-size utility.
  backgroundColor: {
    base: colors.base.DEFAULT,
  },
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize,
  fontWeight: typography.fontWeight,
  spacing,
  borderRadius: radii,
  transitionDuration: motion.duration,
  transitionTimingFunction: motion.easing,
  screens: breakpoints,
} as const;
