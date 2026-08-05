# @toolforge/dev-utils-service

Developer utilities — JSON formatters, JWT decoders, regex testers, hash generators, base64/URL
encoders.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Runtime:** Strong candidate for Cloudflare Workers / Vercel Edge. Pure compute, sub-ms typical,
benefits from global distribution. Bundle target < 1MB per Worker.

**Open question for Phase 2:** at what tool count does it make sense to split this into per-utility
Workers vs. one Worker with routing?
