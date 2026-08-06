# Zipply — What to Work on Next

Last updated: 2026-08-06 Current branch: dev CI status: PASSING on `dev` (quality checks). Docker
build on `preprod`/`main` will fail on `qr-service` — see Priority 0 below.

## Priority 0: Fix the broken `qr-service` Docker build

Status: NOT STARTED — this is a real, currently-latent CI failure, not a hypothetical. Why:
`.github/workflows/docker.yml`'s build matrix includes `{kind:"service",name:"qr-service"}`, but
`services/qr-service/Dockerfile` does not exist (only `apps/web`, `services/api-gateway`, and
`services/pdf-service` have one). The next push to `main` or `preprod` that touches a path in the
workflow's filters will fail that job.

Scope: create `services/qr-service/Dockerfile`, following the pattern in
`services/pdf-service/Dockerfile` (or the shared template at `infra/docker/service.Dockerfile`).
Verify with `docker build -f services/qr-service/Dockerfile -t zipply-qr-service:dev .` before
pushing.

Branch: `dev`. This is small enough to bundle with other Phase 2 work or ship standalone.

## Immediate priorities (next 2 weeks)

### Priority 1: UI Redesign and Mobile Responsiveness

Status: IN PROGRESS — commit `644b971` ("redesign emerald color system, mobile responsive, improved
layouts") already landed a first pass. Confirm what's left before assuming this is done. Why: Tools
work but mobile users (60%+ of traffic for PDF tools) need a polished experience before acquiring
users at scale.

Scope remaining to verify/finish:

- Confirm QR generator mobile UX (preview visible while scrolling through style controls) — not
  independently verified in this doc's audit.
- Fix the stale home page badge copy ("2 tools live" when 3 are listed —
  `apps/web/src/app/page.tsx:103`).
- Fix the leftover blue default frame color in the QR tool
  (`apps/web/src/app/qr-generator/qr-client.tsx:35`, `#2f5fe6` should be an emerald-family color).
- Add `apps/web/src/app/[locale]/qr-generator/` to match the other two tools' locale routes.

Branch: work on `dev`.

### Priority 2: Deploy to a preprod environment

Status: PLANNED — requires cloud accounts. Why: The product needs a real URL for testing before
public launch. Right now nothing is deployed anywhere.

Requires (human operator must provide):

- Fly.io account and API token (for `api-gateway`, `pdf-service`, `qr-service`)
- Vercel account and deploy token (for `web`), or Cloudflare Pages
- Environment variables per each service's `.env.example`

Scope:

- Fix Priority 0 first — a broken Docker build blocks this entirely for `qr-service`.
- Deploy `api-gateway`, `pdf-service`, `qr-service` to Fly.io.
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
6. Start with Priority 0 (the broken Docker build) if untouched, then Priority 1, unless told
   otherwise.
