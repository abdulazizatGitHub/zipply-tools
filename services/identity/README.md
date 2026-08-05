# @toolforge/identity

Identity service — users, organizations, sessions, API keys, RBAC, entitlement resolution.

**Status:** Foundation-phase placeholder. Real implementation lands Phase 2.

**Boundary discipline:** All callers go through `@toolforge/auth-client`. This service is the ONLY
component that may import a vendor auth SDK (Clerk in months 0–9; planned migration to self-hosted
Ory at $X MRR or compliance trigger).

**Contracts owned by this service:** `Principal`, `EntitlementCheck` — both defined in
`@toolforge/auth-client`. The service implementation must conform to those schemas exactly.
