/**
 * @toolforge/tool-contract
 *
 * The single standard every tool implements. Foundation phase exports:
 *   - Manifest schema + types
 *   - Handler interface
 *   - Context interface (platform services as opaque interfaces)
 *   - Helper to define a tool with full type inference
 *
 * This package has only `zod`, `@toolforge/errors`, and `@toolforge/telemetry`
 * as runtime dependencies. Keep it that way — it is depended on by every
 * tool, service, and the registry. Heavy dependencies belong elsewhere.
 */

export * from './manifest.js';
export * from './handler.js';
export * from './context.js';
export * from './define.js';
export * from './platform-services.js';
