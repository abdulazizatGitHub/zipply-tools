# @toolforge/billing

Billing service — subscriptions, plans, entitlements, invoices, customer portal. The ONLY component
that may import the Stripe SDK.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Boundary:** All callers use `@toolforge/billing-client`. Wire-level shape defined there.

**Operational discipline:** Money requires the slowest change cadence on the platform. Every PR
touching this service requires a second reviewer and an ADR for any contract change.
