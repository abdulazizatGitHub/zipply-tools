# @toolforge/metering

Metering service — usage event ingestion at high volume, quota resolution, periodic sync to billing
for usage-based invoicing.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Storage:** ClickHouse for events (write-heavy, analytical reads). Quota state cached in Redis with
periodic reconciliation against ClickHouse.

**Boundary:** Producers use `@toolforge/metering-client` (fire-and-forget with batching and
degrade-safe semantics).

**Failure mode awareness:** metering writes must NEVER block tool completion. Loss tolerance is
documented per event family in Phase 2.
