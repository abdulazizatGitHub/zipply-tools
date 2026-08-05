# @toolforge/notifications

Notifications service — email, in-app, webhooks. Wraps Resend (foundation phase) behind a
vendor-agnostic surface. Outbound webhooks include HMAC signing, retry queue, and a dead-letter UI
exposed through the admin app.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Boundary:** Crash analytics and product analytics SDKs (Sentry, PostHog) may load directly in the
browser. Server-side email and webhook sending goes through this service.
