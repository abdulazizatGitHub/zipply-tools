/**
 * @toolforge/ui
 *
 * Foundation phase exports the utilities every component will need plus a
 * deliberately empty surface for components themselves. Components land in
 * Phase 2 via the shadcn/ui copy-paste pattern (owned source, no runtime
 * lock-in).
 *
 * Component file convention (Phase 2):
 *   src/components/<kebab-name>/{component.tsx, index.ts, *.test.tsx, story.tsx}
 *
 * Each component MUST:
 *   - consume design tokens (no hardcoded colors/sizes)
 *   - meet WCAG 2.1 AA contrast + keyboard interaction
 *   - export from `./src/index.ts`
 */

export { cn } from './lib/cn.js';
export type { ComponentVariants } from './lib/variants.js';
