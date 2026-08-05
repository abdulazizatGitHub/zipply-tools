# @toolforge/ai-gateway

AI gateway — the single chokepoint for every model call from every tool.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Responsibilities:** logical→physical model mapping, caching by deterministic input hash, vendor
fallback, budget enforcement per org/tool/principal, cost attribution, prompt registry, response
streaming.

**Boundary:** Callers use `@toolforge/ai-client`. Only this service may import `openai`,
`@anthropic-ai/sdk`, or other vendor SDKs.

**Why this matters:** without the gateway in place from launch, every AI tool would carry its own
keys and cost surface. The mess is unrecoverable within 6 months of the first AI tool shipping.
