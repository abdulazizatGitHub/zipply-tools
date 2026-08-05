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
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize,
  fontWeight: typography.fontWeight,
  spacing,
  borderRadius: radii,
  transitionDuration: motion.duration,
  transitionTimingFunction: motion.easing,
  screens: breakpoints,
} as const;
