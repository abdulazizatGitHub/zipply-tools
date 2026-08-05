# @toolforge/files

Files service — single owner of object storage interaction. Issues presigned URLs, registers
uploads, drives virus scanning, enforces retention.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Storage:** Cloudflare R2 (primary) — no egress fees. S3 fallback path documented as a secondary
deploy target if R2 has a regional gap.

**Boundary:** All callers use `@toolforge/files-client`. No other component in the monorepo may
import `@aws-sdk/*` or any R2/S3 SDK. Enforced via ESLint `no-restricted-imports` in Phase 2.
