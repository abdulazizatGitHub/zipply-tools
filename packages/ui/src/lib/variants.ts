/**
 * `ComponentVariants` — type helper for variant-driven components.
 * Used in Phase 2 with `class-variance-authority` or equivalent.
 */
export type ComponentVariants<T extends Record<string, Record<string, string>>> = {
  [K in keyof T]?: keyof T[K];
};
