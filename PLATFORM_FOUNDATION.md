# ToolForge — Platform Foundation Memo

**Author role:** ProductForge OS — CTO / Platform Architecture Office **Status:** Foundation
Decision Document (v1.0) **Horizon:** 6 months / 1 year / 3 years **Audience:** Engineering
leadership, founders, first 5–15 engineers

This document is the platform's constitution. It names what we are building, what we are not, what
we will standardize on, what we will defer, and what will break first as we scale. Every section
ends with what it costs.

---

## 0. Recommendation Up Front

Build ToolForge as a **modular monolith on a Turborepo TypeScript-first monorepo**, fronted by
**Next.js (App Router)** for the entire web surface, with **per-domain processing services in
containers** behind a **shared platform core** of identity, billing, metering, files, AI gateway,
and observability. Run on **Cloudflare (edge, R2, CDN) + Fly.io (services) + managed Postgres +
managed Redis** for the first 12 months. Defer Kubernetes, Kafka, microservices proliferation, and
self-hosted auth until measurable pressure forces them.

The single non-negotiable from day one is **the Tool Contract**: a versioned interface that every
tool — present and future — implements. Everything else (stack, infra, vendors) is replaceable. The
contract is not.

What this prioritizes: reversibility, operational simplicity, developer velocity, ecosystem
consistency. What this deprioritizes: maximum theoretical scalability on day one, polyglot freedom,
multi-region active-active.

If we get the Tool Contract, the monorepo discipline, and the observability spine right in months
1–3, everything else is recoverable. If we get those wrong, no amount of later scaling work fixes
the fragmentation.

---

## 1. Problem Reframe & Optimization Target

The request asks for a "scalable tools ecosystem." The implicit optimization target is
**time-to-onboard the Nth tool**, not time-to-launch the first. A platform that ships tool #1 in two
weeks but takes the same two weeks for tool #50 is a failure. A platform that takes six weeks for
tool #1 but ships tool #50 in two days is the goal.

This reframes the entire build:

| Naive framing                 | Reframed                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| Ship PDF tools fast           | Ship the _tool factory_ such that PDF tools are the first three outputs               |
| Add auth, billing, i18n later | These are platform primitives; tools should never own them                            |
| Use the best stack per tool   | Use one stack; pay the abstraction tax once                                           |
| Per-tool SEO                  | Programmatic SEO factory; tools declare metadata, the platform renders 100,000+ pages |
| Per-tool analytics            | One metering pipeline; tools emit events, the platform routes                         |

**The constraint set we are designing against:**

- Team will grow from ~2 to ~15 engineers in 18 months. Most decisions must survive that growth.
- Cost matters. We will not raise infrastructure spending faster than revenue. R2 over S3 alone
  justifies several thousand dollars per month of egress savings at scale.
- This is a content + utility play. SEO is a first-class system, not a marketing afterthought. The
  platform must render millions of programmatic landing pages reliably.
- AI tools will be added — but unevenly. The AI surface must be a gateway, not a per-tool
  integration.
- Internationalization is in scope from day one for SEO reasons (each tool × each language is a
  unique landing page).

**What we are explicitly not optimizing for:**

- Maximum per-tool customization. Tools that need to break the contract are a smell.
- Real-time interactivity beyond file processing. We are not building a collaborative editor.
- Mobile-first apps. Mobile-responsive web, yes. Native apps, no — they double the platform surface.

---

## 2. Ecosystem Architecture (the shape, not the parts)

The platform is six concentric layers. Decisions at layer N are constrained by layers N-1 and above.

```
┌──────────────────────────────────────────────────────────────┐
│  L6  Tool Surface         per-tool UI shells, copy, i18n     │
│      (hundreds of tools, thousands of SEO variant pages)     │
├──────────────────────────────────────────────────────────────┤
│  L5  Tool Contract        the standard every tool implements │
│      (manifest, lifecycle, IO schema, metering events)       │
├──────────────────────────────────────────────────────────────┤
│  L4  Platform Core        identity · billing · metering ·    │
│      files · ai-gateway · notifications · i18n · seo-engine  │
├──────────────────────────────────────────────────────────────┤
│  L3  Processing Plane     domain services (pdf, image, qr,   │
│      convert, dev-utils, ai) + worker pools + job queues     │
├──────────────────────────────────────────────────────────────┤
│  L2  Data Plane           Postgres · Redis · Object Storage  │
│      (R2/S3) · ClickHouse (analytics) · Vector DB (later)    │
├──────────────────────────────────────────────────────────────┤
│  L1  Infrastructure       compute · network · CDN · edge ·   │
│      secrets · IaC · CI/CD · observability backbone          │
└──────────────────────────────────────────────────────────────┘
```

**Why this shape:** Each layer has a single owner concept. Tools never reach below L4. L4 services
never reach into each other except via documented internal APIs. L2 is shared but accessed only
through L3 services — no tool ever speaks to Postgres directly.

**What it costs:** Layered architectures are slower than direct access. We accept ~10–30ms
additional latency per request for the discipline. Worth it for the blast-radius isolation.

---

## 3. Platform Topology & Service Boundaries

### Service inventory (foundation phase — first 12 months)

| Service             | Layer | Purpose                                                               | Boundary justification                                                   |
| ------------------- | ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `web`               | L6    | Next.js app: marketing, tool pages, SEO surface                       | One UI codebase; one routing model; one design system                    |
| `api-gateway`       | L4    | Public API + BFF; routes to internal services; rate limit; auth check | Single ingress = single place to enforce policy                          |
| `identity`          | L4    | Users, orgs, sessions, API keys, RBAC                                 | Auth touches everything; isolate to one service                          |
| `billing`           | L4    | Subscriptions, plans, entitlements, invoices, Stripe integration      | Money requires audit isolation and slow change cadence                   |
| `metering`          | L4    | Usage events, quotas, rate budgets                                    | High write volume; different scaling profile from billing                |
| `files`             | L4    | Upload/download orchestration, presigned URLs, retention, virus scan  | File lifecycle is platform-wide; isolating prevents tool sprawl          |
| `ai-gateway`        | L4    | LLM routing, caching, fallback, cost attribution, prompt registry     | One place to add caching, model swaps, budget caps                       |
| `seo-engine`        | L4    | Programmatic page metadata, sitemap generation, hreflang, JSON-LD     | SEO is a system, not per-tool decoration                                 |
| `notifications`     | L4    | Email, in-app, webhooks                                               | Cross-cutting; centralize to one outbound vendor abstraction             |
| `pdf-service`       | L3    | PDF processing (merge, split, compress, convert, OCR)                 | Heavy native binaries (Ghostscript, qpdf); isolate runtime               |
| `image-service`     | L3    | Resize, convert, compress, background-remove                          | Pillow/libvips runtime; GPU optional for AI variants                     |
| `qr-service`        | L3    | QR/barcode generate/decode                                            | Lightweight; could live in `web` but isolation eases scaling             |
| `convert-service`   | L3    | Document/data format conversions (LibreOffice headless, pandoc)       | Heavy binary runtime; slowest workloads; isolation prevents head-of-line |
| `dev-utils-service` | L3    | JSON/JWT/regex/hash/encode tools                                      | Lightweight; pure compute; ideal Edge Function target                    |
| `worker-pool`       | L3    | Background jobs for any heavy service                                 | Decouple request latency from processing time                            |

**Boundary discipline:**

- L4 services own data. L3 services are stateless processors except for their own job state.
- L3 services never call each other. If `pdf-service` needs an image rendered, it goes through
  `files` (store) → enqueue `image-service` job → poll/callback.
- L3 services never call L4 `billing` or `metering` directly — they emit events to `metering` via a
  fire-and-forget bus.
- All synchronous cross-service traffic goes through `api-gateway`. No service-to-service mesh in
  v1.

### What we are NOT splitting yet (and why)

- **Tool registry** lives inside `web` as a build-time manifest, not its own service. Hundreds of
  tools is fine as a registry; thousands isn't. Defer extraction until tool count > 200 or
  hot-reload of tools is needed.
- **Search** is Postgres full-text on tools + pages until query volume justifies
  Meilisearch/Typesense.
- **Vector DB** waits for the first AI tool that needs retrieval. pgvector on the existing Postgres
  handles the first ~1M vectors.
- **Analytics pipeline** is ClickHouse-managed (Tinybird) — no Kafka, no Flink. We can read from
  Postgres replication or push events directly.

**What it costs:** A modular monolith with extractable seams. Some services share runtimes longer
than purists prefer. We pay that down only when measurable pressure forces it.

---

## 4. The Tool Contract — the single most important platform standard

This is the one thing that **cannot be wrong**, because every tool ever shipped will conform to it.

Every tool is described by a manifest (declarative) and a handler (executable). Together they form
the contract.

**Manifest must declare:**

- `id`, `slug`, `category`, `version`
- `inputs`: typed schema (file types, size limits, options) — used for UI generation and validation
- `outputs`: typed schema — used for download UI and chaining
- `pricing`: free / pro / metered (with rate keys)
- `processing`: `sync | async | streaming` and expected duration class (`<1s | <30s | <5m | longer`)
- `seo`: title patterns, description patterns, related-tools, FAQ schema source
- `i18n`: which locales the tool ships in (UI auto-translates; SEO pages curated)
- `dependencies`: which platform services it consumes (`files`, `ai-gateway`, etc.)
- `runtime`: `edge | node | python | container`

**Handler must implement:**

- A single async function with signature `(input, ctx) → output | jobId`
- `ctx` exposes platform services (files, metering, ai, i18n, logger, traceId) — never direct DB or
  env access
- Tools that exceed a sync budget must return a `jobId` and complete on the worker pool

**Why this matters in numbers:**

- **Onboarding time for tool N:** target 2 engineering days (manifest + handler + tests + SEO copy)
  once contract is stable. Without the contract, every tool would carry its own auth, billing, file
  handling, SEO, and i18n — easily 2 weeks per tool.
- **Blast radius of a broken tool:** isolated to that tool's handler. Cannot corrupt platform state
  because it doesn't have access to platform state.
- **SEO surface:** with `seo` declared, the platform renders `N tools × M variants × L locales`
  pages from one template. At N=100, M=5, L=10, that's 5,000 indexable pages from one engineering
  effort.

**What breaks the contract:**

- A tool that needs raw DB access. → reject; expose a platform service for the use case.
- A tool that needs a custom auth flow. → reject; build it into `identity` or use API keys.
- A tool that needs a one-off third-party SDK. → permit only with an adapter package that other
  tools can also use.

**What it costs:** Contract design takes 3–4 engineering weeks of platform work before tool #1
ships. The temptation to skip this and "iterate the contract from a working tool" is the most
expensive shortcut available to us. Tool #1 retrofitted to the contract is fine; tool #50
retrofitted is a quarter of platform engineering work.

---

## 5. Monorepo Strategy

**Recommendation:** Turborepo + pnpm workspaces. One repository. One Node version. One TypeScript
config. One ESLint config. One Prettier config.

**Why not Nx:** Nx is more powerful and more opinionated. For a TS-first stack with mostly Node
services and a single web app, Turborepo's lighter footprint wins. Revisit if we add a second
language tier (Rust, Go) and need stricter module graph enforcement.

**Why not polyrepo:** Polyrepo at 5 services is tolerable. At 50 services, every cross-cutting
change becomes a coordinated multi-PR dance. With our anticipated tool growth, the cost of polyrepo
compounds non-linearly.

### Layout

```
toolforge/
├── apps/
│   ├── web/                  Next.js — marketing, tool pages, app shell
│   ├── admin/                internal ops console
│   └── docs/                 developer docs (Nextra or similar)
├── services/
│   ├── api-gateway/
│   ├── identity/
│   ├── billing/
│   ├── metering/
│   ├── files/
│   ├── ai-gateway/
│   ├── seo-engine/
│   ├── notifications/
│   ├── pdf-service/          (Node + native bindings; or Python sidecar)
│   ├── image-service/        (Node or Python — single choice; see §6)
│   ├── qr-service/
│   ├── convert-service/      (containerized LibreOffice/pandoc)
│   └── dev-utils-service/
├── packages/
│   ├── tool-contract/        the manifest + handler types and runtime
│   ├── ui/                   design system components (shadcn/ui base)
│   ├── design-tokens/        colors, type, spacing, motion
│   ├── i18n/                 message catalog + locale routing helpers
│   ├── sdk/                  public TS SDK (also published to npm)
│   ├── platform-client/      internal client for platform services
│   ├── telemetry/            OTel wrappers, logger, metrics helpers
│   ├── auth-client/          identity client (RSC + edge friendly)
│   ├── billing-client/
│   ├── files-client/
│   ├── ai-client/
│   ├── seo-kit/              JSON-LD helpers, sitemap, hreflang
│   ├── eslint-config/
│   ├── tsconfig/
│   └── test-utils/
├── tools/
│   ├── create-tool/          scaffolding CLI: `pnpm create-tool pdf-merge`
│   ├── manifest-validator/
│   └── seo-page-generator/
├── infra/
│   ├── terraform/            IaC for cloud resources
│   ├── docker/               base images and shared Dockerfiles
│   └── k6/                   load tests
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Monorepo discipline (mandated)

- **No deep imports between apps or services.** Cross-cutting code lives in `packages/`. Enforced
  via ESLint rules and Turborepo's pipeline.
- **No circular dependencies in `packages/`.** Enforced by `dpdm` in CI.
- **All packages publish stable APIs from `index.ts`.** Internal files are not part of the contract.
- **Build outputs are cached via Turborepo Remote Cache** (Vercel-hosted or self-hosted) from day
  one. Build time is a velocity tax we pay every CI run.

### What breaks first in the monorepo

| Failure                       | When it hits                                               | Mitigation                                                                   |
| ----------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| CI build time > 15 min        | ~30 services, ~50 packages                                 | Turbo remote cache + affected-only builds; eventually split test pipelines   |
| Editor performance degrades   | ~200 packages                                              | Project references in tsconfig; selective `pnpm install --filter`            |
| Single-version policy painful | When one tool needs an incompatible major                  | Allow per-service `package.json` deps; keep shared packages on common majors |
| Tooling lock                  | When a monorepo-wide upgrade (Node, TS, React) takes weeks | Maintain a "platform upgrade" budget — 1 week per quarter dedicated          |

**What it costs:** Monorepo discipline is overhead from day one. We pay maybe 15% slower setup for
tool #1 in exchange for tool #50 being 5× faster.

---

## 6. Recommended Technology Stack

Each row names what it is, why it wins over alternatives, and what we lose by choosing it.

### Frontend & web

| Choice                               | Why                                                                                                             | What we give up                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Next.js 14+ (App Router, RSC)**    | Best SEO toolkit at scale (ISR, RSC, edge rendering); first-class image, i18n, metadata APIs; massive ecosystem | Lock-in to Vercel's mental model; App Router still maturing; build complexity |
| **React 18+ with Server Components** | Render tool landing pages on the server (SEO + speed), interactivity only where needed                          | Mental model overhead for the team                                            |
| **shadcn/ui + Radix**                | Owned source code, no runtime lock-in, accessible primitives                                                    | Manual maintenance of components                                              |
| **Tailwind CSS**                     | Velocity, no CSS-in-JS runtime cost, plays well with RSC                                                        | Verbose markup; opinionated                                                   |
| **TanStack Query** for client state  | Standard for server state on the client                                                                         | Adds dependency; trivial cost                                                 |

### Backend services

| Choice                                                                                                          | Why                                                                           | What we give up                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Node.js 22 + TypeScript** as primary runtime                                                                  | Shared types with frontend; one language for most engineers; vast ecosystem   | Worse performance than Go/Rust for CPU-bound; not the best fit for some image/PDF libs |
| **Python 3.12 (FastAPI)** for processing services where libs demand it (PyMuPDF, Pillow, OpenCV, model serving) | Mature ecosystem for heavy file processing; required for many AI tools        | Second language tier — costs in tooling, hiring, observability standardization         |
| **Fastify** for Node services                                                                                   | Faster than Express, better TS, schema-first                                  | Less ubiquitous than Express                                                           |
| **Hono** for edge functions                                                                                     | Built for edge runtimes (Cloudflare Workers, Vercel Edge); minimal cold start | Smaller ecosystem                                                                      |
| **Zod** as the universal schema language                                                                        | Same schemas for HTTP, jobs, manifests, DB validation                         | Bundle weight; we accept it                                                            |

**The polyglot decision is deliberate but constrained.** Two language tiers — TS primary, Python for
processing — is a known cost. A third tier (Go, Rust) requires explicit ProductForge-level approval.
Polyglot freedom is a tax paid in observability, hiring, and shared package duplication.

### Data plane

| Choice                                                                        | Why                                                                              | What we give up                                              |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **PostgreSQL 16** (managed: Neon or Supabase early; AWS RDS / CloudSQL later) | Mature, predictable, handles OLTP + simple analytics + pgvector                  | Not a queue; not a search engine; will become the bottleneck |
| **Redis** (managed: Upstash early; ElastiCache or Dragonfly later)            | Cache + ephemeral state + queue backend (BullMQ)                                 | Single in-memory store; will need sharding eventually        |
| **Cloudflare R2** for object storage                                          | **No egress fees** — at file-tool scale this saves thousands per month vs. S3    | Less mature ecosystem than S3; some tools assume S3          |
| **ClickHouse (managed via Tinybird)** for OLAP                                | Purpose-built for event analytics; far cheaper than warehousing this in Postgres | Vendor dependency; learning curve                            |
| **pgvector** for early vector workloads                                       | One fewer system to operate until proven need                                    | Will not scale past ~5M vectors with low latency             |

### Queues, jobs, workflows

| Choice                                                            | Why                                                                        | What we give up                                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **BullMQ on Redis** for foundation-phase job queueing             | Lightweight, observable, in our existing stack                             | Not a workflow engine; durable workflow patterns require manual care |
| **Multiple queues by workload class** from day one                | Prevents head-of-line blocking (PDF jobs starving image jobs)              | More config; worth it                                                |
| **Temporal** (managed via Temporal Cloud) — _deferred to year 1+_ | Durable workflows for multi-step AI pipelines and long-running conversions | Cost; complexity; defer until two+ services need workflow semantics  |

### Auth, billing, AI

| Choice                                                                                          | Why                                                                                           | What we give up                                                                                                         |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Clerk** (or WorkOS) for auth in months 0–9                                                    | We do not build auth from scratch in 2026; not a competitive advantage                        | Vendor cost; migration cost later                                                                                       |
| **Migration plan to Ory Kratos/Hydra** at $X MRR threshold                                      | Self-hosted auth becomes cheaper and gives compliance flexibility                             | Engineering investment when triggered                                                                                   |
| **Stripe + Stripe Billing**                                                                     | Industry standard, mature for usage-based and subscription                                    | Stripe lock-in; we abstract behind `billing` service to reduce it                                                       |
| **AI Gateway = internal service** wrapping OpenAI, Anthropic, plus self-hosted (Ollama or vLLM) | One place for caching, routing, fallback, cost attribution; tools never call vendors directly | Engineering cost up front; we pay it because the alternative — 50 tools each calling OpenAI directly — is unrecoverable |

### Infrastructure & operations

| Choice                                                                       | Why                                                                             | What we give up                                                                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Cloudflare** as edge/CDN/DNS/WAF/R2                                        | Single vendor at the edge; R2 egress savings; Workers for cheap edge logic      | Vendor concentration risk; mitigated by escape hatches                                              |
| **Vercel** for `web` and `docs` for months 0–12                              | Best Next.js DX, ISR, image optimization, edge functions                        | Cost at scale; lock-in; planned migration to self-managed Next.js on Fly/AWS if Vercel bill > $X/mo |
| **Fly.io machines** for backend services in months 0–12                      | Scale-to-zero, per-second billing, simple Docker deploy, multi-region trivially | Less mature than AWS; outages have happened                                                         |
| **Terraform** for all infra from day one                                     | IaC is non-negotiable; even one-off resources go through it                     | Initial overhead                                                                                    |
| **GitHub Actions** for CI/CD                                                 | Already in the GitHub workflow; sufficient for our scale                        | Vendor lock; matrix builds can get expensive                                                        |
| **OpenTelemetry** for traces, metrics, logs — vendor-neutral instrumentation | Switch backends without re-instrumenting                                        | Setup cost; team learning curve                                                                     |
| **Grafana Cloud** (Loki + Tempo + Mimir) for observability backend           | Cheaper than Datadog at our scale; OTel-native                                  | Less polished than Datadog; we accept it                                                            |
| **Sentry** for error tracking (web + services)                               | Best in class; integrates everywhere                                            | Cost grows with errors                                                                              |
| **PostHog** for product analytics                                            | Self-hostable; combines events, sessions, feature flags                         | More vendors to operate; balances Grafana for operational telemetry                                 |

### What this stack costs (rough monthly, low scale → mid scale)

| Layer                 | Month 1   | Month 12           | Notes                                                                    |
| --------------------- | --------- | ------------------ | ------------------------------------------------------------------------ |
| Vercel (web)          | $20       | $400–1,500         | Bill curve bends at heavy bandwidth — R2 + Cloudflare in front mitigates |
| Fly.io services       | $100      | $1,000–3,000       | Scale-to-zero for low-traffic services keeps this honest                 |
| Postgres (Neon → RDS) | $30       | $300–800           | Curve bends at write throughput and storage size                         |
| Redis (Upstash)       | $10       | $200–600           | Curve bends at memory + ops/sec                                          |
| R2 storage + ops      | $30       | $200–600           | **Egress free** — saves the largest single line item vs. S3              |
| Clerk / WorkOS        | $25       | $500–1,500         | Curve bends hard at MAU; migration trigger                               |
| Stripe fees           | usage     | usage              | 2.9% + 30¢; not an engineering decision                                  |
| AI providers          | $0        | $200–5,000         | Highly variable; gateway with caching is the most important cost control |
| Grafana Cloud         | $0        | $200–700           | Free tier covers early months                                            |
| Sentry                | $0        | $100–500           |                                                                          |
| PostHog               | $0        | $100–500           |                                                                          |
| GitHub Actions        | $0        | $50–300            |                                                                          |
| **Total**             | **~$215** | **~$3,250–14,000** | Wide band; AI usage is the swing factor                                  |

**Where the cost curve bends:**

1. **R2 vs. S3 at heavy traffic.** Egress alone is the difference between profitable and not for a
   file-tools platform. This is the single highest-leverage infra choice.
2. **AI provider costs.** Without gateway caching and model routing, AI tools become the #1 cost
   line within 6 months of launch.
3. **Vercel bandwidth bill.** Beyond ~5TB/mo egress, self-hosting Next.js on Fly + Cloudflare in
   front is cheaper.
4. **Postgres write throughput.** First serious scaling event — typically read replicas, then
   partitioning, then potentially Vitess-style sharding. Plan, don't pre-build.

---

## 7. Infrastructure Architecture

### Topology (foundation phase)

- **Single region primary** (US-East or EU-West depending on user base). Multi-region defer until
  measurable latency complaints from a second continent.
- **Edge layer global** via Cloudflare — static assets, marketing pages (ISR), dev-utils that fit on
  Workers.
- **Compute** on Fly.io across 2 regions for redundancy; not for latency.
- **Data** in one region, with read replicas in-region; backups cross-region.

### Network & security

- **All inbound public traffic via Cloudflare.** DDoS, WAF, rate-limit at the edge.
- **Internal service traffic** over Fly's private 6PN (WireGuard-backed). No public service
  endpoints except `api-gateway`.
- **Secrets** in Doppler or Infisical (managed). Never in env files. Never in Terraform state.
- **mTLS between services** — deferred until service count > 15 or a compliance trigger.

### Environments

| Environment  | Purpose                     | Data                                    | Cost discipline          |
| ------------ | --------------------------- | --------------------------------------- | ------------------------ |
| `local`      | Dev laptops; Docker Compose | Fake                                    | Free                     |
| `preview`    | Per-PR ephemeral            | Synthetic + masked snapshot             | Auto-destroy after 24h   |
| `staging`    | Pre-prod mirror             | Daily-refreshed masked snapshot of prod | Always-on but downsized  |
| `production` | Production                  | Real                                    | Right-sized + autoscaled |

**Mandated:** Preview environments per PR for `web` and `api-gateway` from day one. They are the
cheapest reliability investment we make.

---

## 8. Deployment Architecture & CI/CD

### Pipeline

```
Push to PR  →  Lint + Type + Unit  →  Affected build (Turbo)  →
Integration tests  →  Preview env  →  Visual regression + Lighthouse  →
Human review  →  Merge to main  →  Build images  →  Deploy to staging  →
Smoke tests + SLO sanity  →  Promote to production (canary 5% → 25% → 100%)
```

### Mandates

- **No deploy without a green CI.** No `[skip ci]` on main.
- **Canary rollouts for any service touching user requests.** 5%/25%/100% with auto-rollback on SLO
  breach.
- **DB migrations are decoupled from deploys.** Migrations are applied via a separate runbook, with
  backwards-compatible patterns (expand-migrate-contract).
- **Feature flags** (LaunchDarkly, Flagsmith, or PostHog) for any user-visible change behind a flag
  by default. New tools launch behind a flag.
- **Rollback is one click and rehearsed.** If we cannot roll back in < 5 minutes, we are not ready
  to ship.

### What breaks first

| Failure                   | When                                               | Mitigation                                                         |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| CI flakiness erodes trust | After 3+ months of growth                          | Quarantine flaky tests; SLA on green-build-time                    |
| Migration lock-in         | First migration that can't be rolled back          | Mandate expand-migrate-contract; require pre-deploy review for DDL |
| Canary detection lags     | When traffic on canary is too low to detect issues | Require synthetic traffic in canary for first 10 minutes           |

---

## 9. Operational Governance

### SLOs from launch (loose, evolved upward)

| Service class                 | Availability                                | p95 latency           | Error budget burn alert |
| ----------------------------- | ------------------------------------------- | --------------------- | ----------------------- |
| `web` (tool pages)            | 99.9%                                       | 800ms TTFB at edge    | 5% in 1h                |
| `api-gateway`                 | 99.9%                                       | 300ms                 | 5% in 1h                |
| `identity`                    | 99.95%                                      | 200ms                 | 2% in 1h                |
| `billing`                     | 99.95%                                      | 500ms                 | 2% in 1h (page)         |
| L3 processing services (sync) | 99.5%                                       | depends on tool class | 10% in 1h               |
| Job processing (async)        | 99% completion within stated duration class | n/a                   | based on queue depth    |

SLOs are not aspirational; they drive the on-call playbook. A breach of `identity` is a page; a
breach of `qr-service` is a ticket.

### On-call

- **Months 0–6:** founders + senior engineers; PagerDuty (or Grafana OnCall) with one tier.
- **Months 6–12:** primary + secondary; one-week rotations; explicit handoff.
- **Year 1+:** two tiers (platform team + tool team) once headcount permits.

**Mandated from day one:**

- Every page has a runbook link.
- Every incident has a postmortem within 5 business days.
- Postmortems are blameless and produce action items with owners.

### Change management

- **No production change outside the pipeline.** Console clicks against prod resources require an
  exception form.
- **Friday deploy ban** is **not** mandated — we'd rather deploy often than ban a day. Instead:
  smaller deploys, better canaries, no risky deploys after 4pm local.
- **Backwards-compatible by default.** Any breaking internal API change requires deprecation,
  dual-write, or both.

---

## 10. Standards & Governance Framework

What's **mandated**, **recommended**, **permitted**, **prohibited** — and who decides exceptions.

| Concern           | Mandated                                     | Recommended                              | Prohibited                      | Exceptions decided by |
| ----------------- | -------------------------------------------- | ---------------------------------------- | ------------------------------- | --------------------- |
| Language          | TS or Python                                 | TS for new services                      | Other languages                 | Platform team         |
| HTTP framework    | Fastify (Node), FastAPI (Py), Hono (edge)    | —                                        | Express in new services         | Platform team         |
| Schema validation | Zod (TS), Pydantic (Py)                      | —                                        | Ad-hoc validation               | None — no exceptions  |
| Logging           | Structured JSON via `@toolforge/telemetry`   | —                                        | console.log in services         | None                  |
| Tracing           | OpenTelemetry SDK                            | —                                        | Untraced HTTP calls             | Platform team         |
| Auth              | `auth-client` package                        | —                                        | Direct Clerk/identity calls     | Platform team         |
| Files             | `files-client` package                       | —                                        | Direct R2/S3 SDK use            | None                  |
| AI calls          | `ai-client` → `ai-gateway`                   | —                                        | Direct OpenAI/Anthropic SDK use | None                  |
| Metering          | `metering-client` for usage events           | —                                        | Untracked usage                 | None                  |
| Secrets           | Doppler/Infisical                            | —                                        | env files in repo               | None                  |
| IaC               | Terraform                                    | —                                        | Console-created prod resources  | Platform team         |
| CSS               | Tailwind                                     | —                                        | CSS-in-JS in new components     | Design system owner   |
| State management  | TanStack Query (server), React state (local) | Zustand for cross-component client state | Redux                           | Frontend lead         |

**Exception process:** A 1-page ADR. Approval by platform team within 5 business days. No silent
deviations. Exceptions that aren't logged become tomorrow's fragmentation.

---

## 11. Observability Architecture

The observability spine is built **before tool #2**. Tools without observability are not in
production.

### Three signals, one toolkit

- **Logs** — structured JSON, `traceId` on every line, shipped to Loki via OTel collector.
- **Metrics** — Prometheus exposition via OTel, shipped to Mimir. RED (rate/errors/duration) per
  service; USE (utilization/saturation/errors) per resource.
- **Traces** — OTel SDK in every service; sampled at 10% default, 100% on errors; shipped to Tempo.
- **Errors** — Sentry for exceptions and unhandled rejections in web and services.
- **Product analytics** — PostHog for funnel, conversion, retention.

### Dashboards mandated per service

- One **service health** dashboard: SLOs, RED metrics, recent errors, top traces.
- One **business** dashboard: requests per plan tier, usage per tool, conversion to paid.

### What breaks first

| Failure                     | When                                            | Mitigation                                                                |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| Trace cardinality explosion | When a tool emits per-user attributes as labels | Linter rule on OTel attribute usage; review at PR time                    |
| Log volume cost             | When verbose debug logs ship to Loki in prod    | Log levels enforced; ERROR/WARN always, INFO sampled, DEBUG never in prod |
| Dashboard sprawl            | Year 1                                          | Owner per dashboard; auto-archive untouched > 60 days                     |

---

## 12. Integration Architecture (internal + external)

### Internal contracts

- **Synchronous internal RPC** via REST/JSON over HTTP (not gRPC in v1 — premature). Schemas in
  `tool-contract` and `platform-client`. Versioned with `/v1/`, `/v2/` URL prefixes.
- **Async events** via Redis Streams or a NATS cluster (decide once metering volume justifies).
  Schemas in `@toolforge/events`. Producers own schemas; consumers tolerate unknown fields.
- **Webhooks (outbound)** — versioned, signed (HMAC), with retry queue and a dead-letter UI in
  `admin`.

### External integrations

- **Stripe** behind `billing-client`. Never called directly from anywhere else.
- **OpenAI/Anthropic/etc.** behind `ai-client` → `ai-gateway`. Never called directly.
- **Email vendor** (Resend or Postmark) behind `notifications`.
- **Crash analytics & product analytics** are the only direct-from-frontend vendor SDKs allowed.

**Why this rigidity:** Every uncontained vendor SDK is a future migration. Behind a single client,
swapping is a backend change. Across 50 tools, swapping is a quarter-long migration.

---

## 13. Scalability Evolution Roadmap

Three horizons. What we build, what we defer, what triggers the next stage.

### Months 0–6 (Foundation)

**Build:**

- Monorepo, Tool Contract v1, web app, api-gateway, identity, billing, metering, files, ai-gateway
  (basic), seo-engine, 1–3 L3 services covering PDF/Image/QR
- Observability spine (OTel, Grafana Cloud, Sentry)
- CI/CD with preview envs, canary deploys
- 10–20 launched tools
- 5–10 supported locales (UI translated; English-curated SEO content for top tools)

**Defer:**

- Kubernetes, service mesh, Kafka, Temporal, multi-region, self-hosted auth

**Trigger to next stage:** First $5–10k MRR, OR 100k MAU, OR tool count > 25.

### Months 6–12 (Productization)

**Build:**

- Workflow engine (Temporal Cloud) for multi-step AI tools and durable conversions
- Read replicas on Postgres; partitioning plan for `events` table
- Self-serve API with per-key rate limits, usage dashboards, programmatic billing
- 30–60 tools live; full programmatic SEO across all tools × top 10 locales
- Admin console for ops (refunds, impersonation, content moderation)
- First two non-founder hires fully onboarded

**Defer:**

- Self-hosted auth (still on Clerk/WorkOS unless cost/compliance forces)
- Multi-region active-active
- Kubernetes

**Trigger to next stage:** Tool count > 80, OR $50k MRR, OR a compliance requirement (SOC2 path), OR
Vercel/Fly cost outpacing self-managed.

### Year 1–3 (Platform maturity)

**Build:**

- Migrate `web` off Vercel to self-managed Next.js on Fly/AWS once egress + bandwidth costs cross
  threshold
- Migrate auth to self-hosted (Ory) if compliance or cost demands
- Postgres sharding strategy or move some workloads to per-tenant DBs
- Kafka or NATS JetStream as durable event backbone (replaces Redis Streams for cross-service
  events)
- Multi-region read serving for SEO pages globally
- SOC 2 Type II completion
- Tool count > 200; AI gateway serving > $10k/mo of inference with caching ratio > 30%

**Defer indefinitely (revisit only on hard evidence):**

- Service mesh (Linkerd/Istio) — overkill until 30+ services
- Kubernetes — only if Fly or chosen PaaS becomes a constraint
- Custom orchestration — buy or use managed (Temporal, Argo)

---

## 14. Organizational Scaling Strategy

Team topology drives architecture (Conway's Law). Architecture drives team topology back. We plan
both together.

### Headcount evolution

| Phase       | Team            | Topology                                                          |
| ----------- | --------------- | ----------------------------------------------------------------- |
| Months 0–3  | 2–3 generalists | One squad doing everything                                        |
| Months 3–9  | 4–6             | Split: Platform (core + infra) vs. Tools (new tool delivery)      |
| Months 9–18 | 7–12            | Platform · Tools-A · Tools-B · Growth (SEO + analytics)           |
| Year 2      | 12–20           | + Reliability/SRE function; AI guild (not a team — cross-cutting) |
| Year 3      | 20+             | + Security/Compliance lead; possibly a Tools-by-vertical split    |

### Mandated organizational standards

- **Every service has one owning team.** Unowned services become tomorrow's incidents.
- **Platform team owns the contract, not the tools.** Tools team owns delivery against the contract.
- **No service without a runbook.** No on-call rotation without two qualified responders.
- **Hiring profile bias:** generalists in months 0–6; specialists (SRE, security, ML platform)
  brought in only when the work is named and ongoing.

### Bottlenecks to expect

| Bottleneck                                 | When        | Mitigation                                                                                        |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------- |
| Platform team becomes the merge gate       | Month 6–9   | Move common changes to "platform-permitted" lanes with self-service templates                     |
| Knowledge silos                            | Year 1      | Documentation as part of definition-of-done; rotation between platform and tools every 2 quarters |
| Hiring lag behind tool growth              | Year 1+     | Slow tool roadmap before quality slips; explicitly trade growth for sustainability                |
| Founder context as single point of failure | Months 6–12 | Decision log; ADRs; weekly platform sync recorded                                                 |

---

## 15. Operational Maturity Roadmap

| Capability                    | Month 3 target                   | Month 12 target                       | Year 3 target                                   |
| ----------------------------- | -------------------------------- | ------------------------------------- | ----------------------------------------------- |
| **Deploy frequency**          | Daily on web; weekly on services | Multi-daily on web; daily on services | Multi-daily on all                              |
| **Lead time (commit → prod)** | < 1 day                          | < 4 hours                             | < 1 hour                                        |
| **MTTR**                      | < 4 hours                        | < 1 hour                              | < 30 minutes                                    |
| **Change failure rate**       | < 15%                            | < 10%                                 | < 5%                                            |
| **SLO breach response**       | Manual paging, ad-hoc            | Auto-paging + runbooks                | Auto-paging + auto-mitigation for top 5 classes |
| **Postmortems**               | Founder-written                  | Owned by service team                 | Themed reviews quarterly                        |
| **Capacity planning**         | Reactive                         | Quarterly review                      | Continuous w/ forecasting                       |
| **Cost reviews**              | Monthly                          | Weekly                                | Real-time per-service budgets                   |
| **Security reviews**          | Pre-launch checklist             | Quarterly + per-service               | Continuous + SOC2 controls                      |

These are DORA-shaped metrics deliberately. They are the cheapest objective measures of platform
health.

---

## 16. Programmatic SEO & i18n as a System

SEO is the cheapest, highest-leverage acquisition channel for a tools platform. The platform must
treat it as a first-class system.

### Architecture

- **`seo-engine` service** owns sitemap generation, hreflang mapping, structured-data assembly,
  canonical resolution.
- **Tool manifests declare SEO intent** (title patterns, variants, FAQ source, internal-link
  targets). The engine renders pages from this declarative input.
- **Programmatic page templates** in `web` consume `seo-engine` output server-side via RSC.
- **Pre-rendered, ISR-revalidated** — never CSR for SEO surfaces.

### Internationalization

- **UI strings:** machine-translated baseline with `i18n` package; human-curated for top 5 locales.
- **SEO content:** hand-curated for top 5 tools × top 5 locales (25 high-value pages); programmatic
  for the long tail with translation review.
- **Routing:** locale-prefixed paths (`/es/pdf-to-word`) — not subdomains. Subdomains fragment
  authority.
- **Hreflang automation:** required on every locale variant; mistakes here cost weeks of ranking.

### What breaks first

| Failure                                  | When                    | Mitigation                                                                 |
| ---------------------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| Duplicate-content penalty across locales | First 10k pages indexed | Strict hreflang; canonical to source locale where translation is thin      |
| Sitemap size                             | > 50k pages             | Split sitemaps by tool category; sitemap index                             |
| Render budget on Vercel                  | First 100k ISR pages    | Move SEO surface to self-managed Next or static export ahead of bill spike |
| Translation drift                        | Year 1                  | Translation source-of-truth in Crowdin; CI check for missing keys          |

---

## 17. What Breaks First — Failure Mode Analysis (consolidated)

The honest list, ranked roughly by when each pressure hits.

| #   | Failure                                            | When                                        | Blast radius                   | Fix path                                                                                                   |
| --- | -------------------------------------------------- | ------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 1   | Tool Contract is wrong                             | Month 2–3                                   | Every future tool              | Pay the contract-design cost up front; v1 ship gates contract review                                       |
| 2   | Single Postgres can't keep up with metering events | Month 6–12                                  | All write traffic              | Move metering to ClickHouse from start; Postgres only for state                                            |
| 3   | AI provider costs blow past plan                   | Month 3–9 (whenever first AI tool launches) | Whole business margin          | AI gateway with caching + per-tool budget caps                                                             |
| 4   | Auth vendor cost step-function                     | Month 9–18 (at MAU tier change)             | Whole platform                 | Pre-built migration plan to self-hosted Ory; rehearse it                                                   |
| 5   | Vercel bandwidth bill                              | Year 1                                      | Web budget                     | Cloudflare in front; plan move to self-managed Next                                                        |
| 6   | Job queue head-of-line blocking                    | Month 3+                                    | Tool latency                   | Separate queues by workload class from day one                                                             |
| 7   | Monorepo CI time                                   | Month 9–18                                  | Engineering velocity           | Turbo remote cache; affected-only builds; selective test runs                                              |
| 8   | Untracked secrets sprawl                           | Month 6+                                    | Security posture               | Doppler/Infisical mandate from day one; audit script in CI                                                 |
| 9   | Observability gaps                                 | Month 3–9                                   | MTTR + customer trust          | OTel from day one; SLOs from launch                                                                        |
| 10  | Translation drift / SEO duplicate content          | Year 1                                      | Organic traffic                | Translation workflow in CI; hreflang automation                                                            |
| 11  | Untracked feature flags rotting                    | Year 1+                                     | Code health, surprise breakage | Flag TTL enforcement; quarterly cleanup                                                                    |
| 12  | DB migration locked the table                      | Any time                                    | Production downtime            | Expand-migrate-contract mandated; reviewer required for DDL                                                |
| 13  | Cross-service tight coupling sneaks in             | Month 6–12                                  | Independent deployability      | ESLint module-boundary rules; quarterly dependency audit                                                   |
| 14  | Single-region outage                               | Any time                                    | All users                      | Multi-region for DB backups + DNS failover early; full multi-region active-active deferred until justified |
| 15  | One engineer's tribal knowledge                    | Year 1                                      | Operational continuity         | ADRs + runbooks part of definition-of-done                                                                 |

---

## 18. Platform-Wide Risks & Tradeoffs

| Risk                                                         | Probability        | Severity | Mitigation strategy                                                                                                  |
| ------------------------------------------------------------ | ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| Premature platformization (over-engineering before tool #5)  | High               | Medium   | This memo's discipline: build only the Tool Contract + platform core + 3 tools first; resist "what about…" expansion |
| Tool contract leaks abstractions (e.g., a tool needs raw DB) | Medium             | High     | Reject; add platform primitive; enforce in code review                                                               |
| Vendor concentration (Cloudflare + Vercel + Stripe + Clerk)  | Medium             | Medium   | All wrapped behind clients; escape hatches documented; one named migration plan per vendor                           |
| Polyglot drift (TS + Python becomes TS + Python + Go + Rust) | Medium             | High     | Explicit two-tier policy; ADR required for third language                                                            |
| AI cost spiral                                               | High               | High     | Gateway with caching, budgets, model routing from day one                                                            |
| Migration debt half-complete (Clerk → Ory stalls at 60%)     | Medium             | High     | Migration plans include exit criteria and a sunset date                                                              |
| Founder/CTO dependency                                       | High in months 0–6 | High     | Documented decisions; ADR log; weekly platform review with team                                                      |
| Cost overrun before revenue                                  | Medium             | High     | Monthly cost review; per-service budgets in Grafana; AI cost real-time alerting                                      |
| SEO penalty from thin content                                | Medium             | High     | Programmatic ≠ thin; human-curated hub pages per category; quality bar enforced                                      |

### Explicit tradeoffs accepted

1. **We trade theoretical microservices independence for operational simplicity.** Modular monolith
   plus a few extracted services. We pay this in slightly tighter coupling and slightly slower team
   scaling, in exchange for one-quarter of the operational burden of full microservices.
2. **We trade polyglot freedom for shared types and one toolchain.** TS-primary plus Python where
   libraries require. Engineers who want Go pay an ADR cost.
3. **We trade vendor neutrality for short-term velocity** in auth and billing. Wrapped behind
   clients; migration plans named.
4. **We trade infinite scalability planning for current-scale optimization.** No Kafka, K8s, or
   service mesh on day one. They are migration targets when measured pressure arrives, not
   pre-emptive choices.
5. **We trade per-tool customization for ecosystem consistency.** Tools that don't fit the contract
   are platform discussions, not engineering decisions.

---

## 19. Decision Priorities — What This Recommendation Optimizes Against

Per the ProductForge decision priority order, this foundation prioritizes:

1. **Reversibility** ✅ Every vendor wrapped; migration paths named; no irreversible choices in
   foundation.
2. **Reliability & operational safety** ✅ Observability spine from day one; SLOs from launch;
   canary deploys mandated.
3. **Long-term maintainability** ✅ Tool Contract is the load-bearing standard; monorepo discipline;
   documented decisions.
4. **Organizational velocity** ✅ Generalist-friendly stack; scaffolding CLIs; preview envs; remote
   cache.
5. **Ecosystem consistency** ✅ Single design system, single auth, single billing, single AI
   surface.
6. **Cost efficiency** ✅ R2 over S3; scale-to-zero compute; AI gateway caching.
7. **Strategic optionality** ✅ Vendor escape hatches; modular monolith easy to extract from.
8. **Feature velocity (short-term)** ⚠️ **Explicitly deprioritized.** Tool #1 ships 2–4 weeks later
   than the naive path so that tool #50 ships in days, not weeks.

The deprioritization to call out loudly: **tool #1 will ship slower than a naive build.** That is
the entire point. Anyone evaluating this plan in week 4 should know they signed up for that.

---

## 20. Stop / Go / Defer — Hard Criteria

When to revisit a major decision:

| Decision                              | Reconsider when                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Stay on Clerk for auth                | $X MRR threshold, OR compliance requirement (SOC 2 with custom controls), OR auth cost > 5% of infra spend          |
| Stay on Vercel for web                | Monthly bill > self-hosted equivalent + 3 weeks of engineering effort to migrate, OR SEO surface > 500k pages       |
| Stay on Fly.io for services           | A region or feature gap blocks a real customer requirement, OR cost > AWS equivalent at our footprint               |
| Stay on modular monolith              | Two services need genuinely independent scaling AND the extraction can be done in one sprint                        |
| Stay on BullMQ for queues             | A second multi-step workflow is requested (move to Temporal) OR durable event semantics needed (move to NATS/Kafka) |
| Stay single-region                    | First customer cohort outside primary region complains about latency with data to back it                           |
| Stay on pgvector                      | Vector count > 5M OR query p95 > 300ms                                                                              |
| Stay on managed ClickHouse (Tinybird) | Cost exceeds self-managed ClickHouse + ops budget                                                                   |

When to **stop** something:

- Stop building a tool if it cannot fit the contract within one ADR cycle. The tool isn't the
  problem; the contract gap is.
- Stop a migration that has stalled at 60–70% for two quarters. Either finish it as a P0 or roll it
  back. Half-migrated systems are the most expensive state.

When to **defer**:

- Anything that can be a "second tier" decision: K8s, service mesh, Kafka, polyglot expansion,
  multi-region active-active.

---

## 21. Foundation-Phase Build Sequence

A 90-day shape, since "foundation" needs a concrete first move:

**Weeks 1–2:**

- Repo setup, Turborepo, pnpm workspaces, base CI
- Tool Contract v1 drafted, reviewed, frozen
- Observability spine: OTel SDK, Grafana Cloud account, Sentry, base dashboards
- IaC scaffolding (Terraform); Cloudflare + Fly + Vercel + Neon accounts provisioned

**Weeks 3–5:**

- `identity` (Clerk integration), `billing` (Stripe stubs), `files` (R2 upload/download)
- `web` shell with Next.js App Router, design system base, i18n routing
- `api-gateway` with auth + rate limit
- First tool (`pdf-merge`) end-to-end as contract reference

**Weeks 6–9:**

- `metering` service + ClickHouse pipeline
- `ai-gateway` v1 (OpenAI + Anthropic routing, caching)
- `seo-engine` v1 (sitemap, hreflang, JSON-LD)
- Tools 2–5 (image-resize, qr-generate, pdf-compress, json-format)
- Preview environments per PR working end-to-end

**Weeks 10–13:**

- Tools 6–10
- First locale launch (English + 2 more)
- Admin console v1
- SLOs published; on-call rotation set up
- First postmortem (intentionally rehearsed)

**Exit criteria for "foundation phase complete":**

- 10+ tools live, all conforming to contract
- 99.9% web availability for 30 consecutive days
- Lead time commit-to-prod < 4 hours
- One engineer can scaffold a new tool in < 2 days
- Cost per tool processing < $0.001 average
- All 12 standards enforceable in CI

---

## 22. Anti-Patterns to Police Against Ourselves

Behaviors that will quietly destroy this platform if unchecked. Worth periodic re-reading.

- Building "platform features" that no current tool needs. The platform earns its right to exist by
  serving tools, not by being elegant.
- Tools that bypass the contract because "it's easier this time." Every exception becomes a
  precedent.
- Adding a fourth language because one engineer prefers it. Languages compound costs.
- Microservice extraction without a measured reason. Distributed systems are only sometimes worth
  their distribution cost.
- Reliability theater (dashboards no one reads, SLOs no one defends, runbooks last touched in
  March).
- Cost theater (reserved instances against bursty workloads; spot against stateful ones).
- Governance theater (RFC processes slower than the decisions they protect).
- Premature multi-region.
- Premature Kubernetes.
- Premature Kafka.
- "We'll just" — the most expensive two words in platform engineering.

---

## 23. What This Memo Doesn't Decide (Open Threads)

These are deliberately left for follow-up ADRs, not papered over here:

1. **Specific AI gateway implementation** — build vs. fork (e.g., LiteLLM, Portkey). Recommend build
   initially with a 100-line wrapper; revisit at $5k/mo inference.
2. **Vector DB choice at scale** — pgvector vs. Qdrant vs. managed. Defer until first AI tool
   requires it.
3. **Email vendor** — Resend vs. Postmark vs. SES. Low stakes; pick Resend for DX in v1.
4. **Translation workflow vendor** — Crowdin vs. Localizely vs. Lokalise. Decide at locale #4.
5. **Specific SOC 2 timeline** — depends on enterprise sales need; revisit at $50k MRR.
6. **Frontend testing strategy depth** — Playwright + Vitest baseline; visual regression vendor
   (Chromatic vs. Argos) decide post-design-system stabilization.
7. **Self-hosted vs. managed Postgres timing** — let cost + control needs decide, not preference.

---

## Closing

This is not a plan to follow rigidly. It is a constitution to disagree with deliberately. Every
decision here is defensible against the criteria the foundation phase optimizes for: reversibility,
reliability, maintainability, velocity, consistency, cost, optionality.

The most important sentence in this document is: **the Tool Contract is the only standard we cannot
afford to get wrong.** If you take away one thing from this, take that.

The second most important: **build only what tool #50 will need, and prove it via tool #1–#5.**
Anything that doesn't survive that test is premature.

Sign here, build that, and revisit this memo every quarter to test whether it still describes
reality. The day it doesn't, write the next one — but write it, don't drift away from it silently.

— ProductForge OS
