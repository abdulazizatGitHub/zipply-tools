# Zipply — What to Work on Next

Last updated: 2026-08-08 Current branch: dev CI status: PASSING on `dev` (quality checks). Docker
build on `preprod`/`main` no longer fails for `qr-service` — it was removed from the build matrix on
2026-08-08 (see Priority 0 below) rather than fixed by adding a Dockerfile.

## Priority 0: Give `qr-service` a Dockerfile

Status: NOT STARTED, but no longer CI-blocking. Previously this was framed as "fix the broken
`qr-service` Docker build" — `.github/workflows/docker.yml`'s build matrix included
`{kind:"service",name:"qr-service"}` with no `Dockerfile` to build (only `apps/web`,
`services/api-gateway`, and `services/pdf-service` had one), which would have failed the next
qualifying push. **Fixed 2026-08-08** by removing `qr-service` from the matrix instead (see
`DECISIONS.md` ADR-007) — CI is no longer at risk. The remaining work is real but lower urgency:
`qr-service` still can't be built into an image or deployed until it has a Dockerfile.

Scope: create `services/qr-service/Dockerfile`, following the pattern in
`services/pdf-service/Dockerfile` (or the shared template at `infra/docker/service.Dockerfile`),
then add `{kind:"service",name:"qr-service"}` back to the matrix in `.github/workflows/docker.yml`.
Verify with `docker build -f services/qr-service/Dockerfile -t zipply-qr-service:dev .` before
pushing.

Branch: `dev`. This is small enough to bundle with other Phase 2 work or ship standalone.

## Known truth gaps

- User-facing pages claim "files deleted automatically within 1 hour" in 19 locations across 8 files
  (e.g. `apps/web/src/app/pdf-merge/page.tsx:19`, `pdf-split/page.tsx:28`, `page.tsx:145`). This is
  enforced today, but only as lazy in-memory eviction inside `pdf-service`'s dev-only file store
  (`services/pdf-service/src/registry/files-memory.ts` `evictExpired()`) — not a background sweeper,
  and it does **not** survive a service restart, which destroys files immediately regardless of
  their 1-hour window (see `ZIPPLY_CONTEXT.md` Known Issue #7). The QR tool makes no such claim,
  correctly, since it never touches a file store.

## Immediate priorities (next 2 weeks)

### Priority 1: UI Redesign and Mobile Responsiveness

Status: IN PROGRESS — commit `644b971` ("redesign emerald color system, mobile responsive, improved
layouts") already landed a first pass. The brand primary has since moved to Penn Blue `#141E5A`
(superseding that emerald pass — see `DECISIONS.md` ADR-004), so this priority now also covers
migrating the live palette, not just finishing the emerald-era layout work. Confirm what's left
before assuming this is done. Why: Tools work but mobile users (60%+ of traffic for PDF tools) need
a polished experience before acquiring users at scale.

Scope remaining to verify/finish:

- Migrate `packages/design-tokens/src/index.ts`'s `brand` scale (currently `#059669`-family emerald)
  and the rendered site to the frozen Penn Blue `#141E5A` / warm off-white `#F8F5F1` palette — see
  `DECISIONS.md` ADR-004. This is the largest remaining piece of Priority 1.
- Finalize per-tool accent colors (not decided yet — don't invent hex values ahead of this).
- Confirm QR generator mobile UX (preview visible while scrolling through style controls) — not
  independently verified in this doc's audit.
- ~~Fix the stale home page badge copy~~ — done 2026-08-08 (`apps/web/src/app/page.tsx:103`, now
  reads "3 tools live").
- ~~Fix the leftover blue default frame color in the QR tool~~ — done 2026-08-08
  (`apps/web/src/app/qr-generator/qr-client.tsx:35`, now `#141E5A`, the new brand primary — not
  emerald).
- Add `apps/web/src/app/[locale]/qr-generator/` to match the other two tools' locale routes.

Branch: work on `dev`.

### Priority 2: Deploy to a preprod environment

Status: PLANNED — requires cloud accounts. Why: The product needs a real URL for testing before
public launch. Right now nothing is deployed anywhere.

Requires (human operator must provide):

- Fly.io account and API token (for `api-gateway`, `pdf-service`; `qr-service` once Priority 0 ships
  it a Dockerfile and it's back in the build matrix)
- Vercel account and deploy token (for `web`), or Cloudflare Pages
- Environment variables per each service's `.env.example`

Scope:

- Deploy `api-gateway`, `pdf-service` to Fly.io. `qr-service` is not deployable yet — see Priority 0
  — and is not required to unblock this priority for the other three components.
- Deploy `web` to Vercel.
- Point a subdomain at the preprod environment.
- Verify the end-to-end PDF merge/split flow works against the deployed stack (the current
  `/v1/_dev/files` in-memory upload route will not survive a multi-instance or restarted deploy —
  decide whether preprod ships with that known limitation or waits for a real `files` service).

### Priority 3: PDF Compress tool

Status: PLANNED — not started. Why: Highest-traffic PDF tool after merge/split, per typical
competitor usage patterns. Scope: new tool following the exact pattern in `AGENT_INSTRUCTIONS.md` §
How to add a new tool — `pnpm scaffold:tool pdf-compress --service pdf-service --runtime node`,
manifest, handler, test, registration, web page. `pdf-lib` doesn't do compression natively — this
will likely require an ADR choosing a compression approach (Ghostscript/qpdf via container vs.
accepting pdf-lib's limits).

## Medium-term priorities (next month)

- Real `identity` service (Clerk integration) — unblocks actual authentication; today every request
  is anonymous regardless of credentials sent.
- Real `files` service (Cloudflare R2) — unblocks persistent uploads; today files vanish on service
  restart.
- Real `metering` service + wiring the already-complete `@toolforge/metering-client` into
  `pdf-service`/`qr-service` in place of the current no-op stub — today no usage event has ever
  actually been recorded.
- Observability backend (Grafana Cloud or equivalent) — local OTel → Jaeger exists in
  `infra/docker-compose.yml`; nothing ships outside a developer's machine yet.
- Production deployment with domain zipply.tools.
- SEO: sitemap, structured data verified in Search Console (once there's a public URL to submit).

## What is explicitly NOT a priority right now

- Billing / Stripe / paid plans
- AI tools (`ai-gateway` stays a stub)
- Self-hosted auth
- Multi-region
- Kubernetes
- More than English locale content
- "Cleaning up" `services/qr-service` by removing it — confirm with the operator whether it has a
  planned future (e.g., a public API) before deleting a fully working, tested service.

## How to pick up this project as a new agent

1. Read [ZIPPLY_CONTEXT.md](./ZIPPLY_CONTEXT.md) — understand what exists and what's actually a
   stub.
2. Read this file — understand what to work on.
3. Read [DECISIONS.md](./DECISIONS.md) — understand why things are the way they are (especially why
   QR generation is client-side and why `qr-service` still exists unused).
4. Read [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) — understand how to work correctly in this
   repo (hard rules, how to add a tool, what requires human operator action).
5. Run `git checkout dev && pnpm validate` — confirm CI passes locally before changing anything.
6. Start with Priority 0 (`qr-service`'s missing Dockerfile) if untouched, then Priority 1, unless
   told otherwise.
