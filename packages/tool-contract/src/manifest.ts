/**
 * Tool Manifest — the declarative description of a tool.
 *
 * Manifests are validated at build time by `tools/manifest-validator` and at
 * runtime by the registry. They drive UI generation, SEO page rendering,
 * pricing enforcement, and capability gating.
 *
 * Version this schema deliberately. Breaking changes require an ADR and a
 * migration plan for all existing manifests.
 */

import { z } from 'zod';

/** Stable identifier conventions. */
const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'Use kebab-case, [a-z0-9-] only.');

const semverSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/, 'Use semver MAJOR.MINOR.PATCH(-prerelease).');

/** Closed set of tool categories. Add cautiously — affects SEO and navigation. */
export const ToolCategory = z.enum([
  'pdf',
  'image',
  'qr',
  'convert',
  'dev-utils',
  'ai',
  'video', // reserved
  'data', // reserved
]);
export type ToolCategory = z.infer<typeof ToolCategory>;

/** Runtimes a tool can declare. Affects where the handler is scheduled. */
export const ToolRuntime = z.enum(['edge', 'node', 'python', 'container']);
export type ToolRuntime = z.infer<typeof ToolRuntime>;

/** Processing modes — sync (fast, in-request) vs. async (job queue). */
export const ProcessingMode = z.enum(['sync', 'async', 'streaming']);
export type ProcessingMode = z.infer<typeof ProcessingMode>;

/** Coarse duration class drives queue selection and timeout policy. */
export const DurationClass = z.enum(['lt-1s', 'lt-30s', 'lt-5m', 'longer']);
export type DurationClass = z.infer<typeof DurationClass>;

/** A single tool input slot. */
export const ToolInputSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['file', 'text', 'number', 'boolean', 'json', 'url']),
  required: z.boolean().default(true),
  // For files
  acceptMimeTypes: z.array(z.string()).optional(),
  maxBytes: z.number().int().positive().optional(),
  // For text/number
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  // For json
  jsonSchema: z.record(z.unknown()).optional(),
  // UX hints
  label: z.string().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.unknown().optional(),
});
export type ToolInput = z.infer<typeof ToolInputSchema>;

/** A single tool output. */
export const ToolOutputSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['file', 'text', 'json', 'url']),
  mimeType: z.string().optional(),
  description: z.string().optional(),
});
export type ToolOutput = z.infer<typeof ToolOutputSchema>;

/** Pricing tier and metering keys. */
export const PricingSchema = z.object({
  tier: z.enum(['free', 'pro', 'metered']),
  meterKey: z.string().optional(),
  freeUsagePerMonth: z.number().int().nonnegative().optional(),
});

/** A programmatic SEO variant — drives generation of related landing pages. */
export const SeoVariantSchema = z.object({
  slugSuffix: slugSchema,
  titleOverride: z.string().optional(),
  descriptionOverride: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const FaqSchema = z.object({
  q: z.string(),
  a: z.string(),
});

/** SEO declaration consumed by the seo-engine to render landing pages. */
export const SeoSchema = z.object({
  titlePattern: z.string(),
  descriptionPattern: z.string(),
  keywords: z.array(z.string()).default([]),
  variants: z.array(SeoVariantSchema).optional(),
  faqs: z.array(FaqSchema).optional(),
  relatedToolIds: z.array(slugSchema).optional(),
});

/** i18n declaration — which locales the tool supports. */
export const I18nSchema = z.object({
  defaultLocale: z.string().min(2),
  supportedLocales: z.array(z.string().min(2)).min(1),
  /** Locales where SEO content has been human-curated (vs. machine-translated). */
  seoCuratedLocales: z.array(z.string().min(2)).optional(),
});

/** Platform services a tool depends on. */
export const PlatformServiceName = z.enum(['files', 'ai-gateway', 'metering', 'notifications']);
export type PlatformServiceName = z.infer<typeof PlatformServiceName>;

export const DependenciesSchema = z.object({
  platformServices: z.array(PlatformServiceName).default([]),
  /** Free-form list of external SDKs. Reviewers should challenge these. */
  externalServices: z.array(z.string()).default([]),
});

/** Operational policies. Enforced by the api-gateway and runtime. */
export const PoliciesSchema = z.object({
  maxInputBytes: z.number().int().positive(),
  maxOutputBytes: z.number().int().positive(),
  retentionSeconds: z.number().int().nonnegative(),
  rateLimitPerMinute: z.number().int().positive().optional(),
  /** Hard wall-clock timeout for sync invocations. */
  syncTimeoutMs: z.number().int().positive().optional(),
});

/** Display metadata for UI surfaces. */
export const DisplaySchema = z.object({
  name: z.string().min(1).max(60),
  tagline: z.string().min(1).max(160),
  description: z.string().min(1),
  icon: z.string().optional(),
});

/** The full manifest. */
export const ToolManifestSchema = z.object({
  id: slugSchema,
  slug: slugSchema,
  version: semverSchema,
  category: ToolCategory,
  display: DisplaySchema,
  inputs: z.array(ToolInputSchema),
  outputs: z.array(ToolOutputSchema),
  processing: z.object({
    mode: ProcessingMode,
    durationClass: DurationClass,
    runtime: ToolRuntime,
    maxConcurrent: z.number().int().positive().optional(),
  }),
  pricing: PricingSchema,
  seo: SeoSchema,
  i18n: I18nSchema,
  dependencies: DependenciesSchema,
  policies: PoliciesSchema,
  /** Manifest schema version this manifest conforms to. */
  manifestVersion: z.literal('1').default('1'),
});

export type ToolManifest = z.infer<typeof ToolManifestSchema>;

/**
 * Parse and validate a manifest object. Throws ZodError on failure.
 * Caller (registry, validator CLI) is responsible for translating to a
 * user-facing message.
 */
export function parseToolManifest(input: unknown): ToolManifest {
  return ToolManifestSchema.parse(input);
}
