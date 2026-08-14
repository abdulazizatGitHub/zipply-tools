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

export { Button } from './components/button/index.js';
export type { ButtonProps, ButtonSize, ButtonVariant } from './components/button/index.js';

export { Card } from './components/card/index.js';
export type { CardProps } from './components/card/index.js';

export { DropZone } from './components/drop-zone/index.js';
export type { DropZoneProps } from './components/drop-zone/index.js';

export { Badge } from './components/badge/index.js';
export type { BadgeProps, BadgeVariant } from './components/badge/index.js';

export { StepIndicator } from './components/step-indicator/index.js';
export type { StepIndicatorProps, StepStatus } from './components/step-indicator/index.js';

export { Modal } from './components/modal/index.js';
export type { ModalProps } from './components/modal/index.js';

export { ProcessingPanel } from './components/processing-panel/index.js';
export type { ProcessingPanelProps } from './components/processing-panel/index.js';

export { ResultPanel } from './components/result-panel/index.js';
export type { ResultPanelProps } from './components/result-panel/index.js';
