# Zipply — Project Context

Last updated: 2026-08-06 (branch `dev`, commit `644b971`)

> **Read this file first, every session.** It describes what actually exists in this repository
> today, not what was originally planned. Where reality and the original plan
> ([`PLATFORM_FOUNDATION.md`](./PLATFORM_FOUNDATION.md)) diverge, this file wins. If you find this
> file is stale, fix it — don't silently work around it.

## What this is

Zipply is a free, no-signup web app offering small file-processing tools — currently PDF merge, PDF
split, and a QR code generator. It's built on a much larger monorepo scaffold ("ToolForge")
originally designed as a platform for hundreds of tools, but only a thin slice of that platform is
actually implemented. Most of the platform's L4 services (identity, billing, metering, files,
ai-gateway, etc.) exist only as placeholder stubs.

## Domain and branding

- Domain: zipply.tools (not yet pointed at anything — see [Deployment status](#deployment-status))
- Brand: Zipply (public-facing name; internal package scope is still `@toolforge/*` — see
  [DECISIONS.md](./DECISIONS.md) ADR-006)
- License: Proprietary — Copyright (c) 2025 Zipply. All rights reserved. See [`LICENSE`](./LICENSE).
- Contact: abdulwork058@gmail.com

## Technology stack

Versions below are read directly from `package.json` files — treat this list as authoritative over
`PLATFORM_FOUNDATION.md`'s aspirational stack table.

| Layer                                 | Choice                      | Version                                                    |
| ------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| Monorepo                              | Turborepo + pnpm workspaces | turbo `^2.2.3`, pnpm `9.12.3` (pinned in `packageManager`) |
| Language                              | TypeScript                  | `^5.6.3`                                                   |
| Node                                  | Node.js                     | `>=22.0.0 <23.0.0`                                         |
| Web framework                         | Next.js (App Router)        | `^14.2.15`                                                 |
| UI                                    | React                       | `^18.3.1`                                                  |
| Styling                               | Tailwind CSS                | `^3.4.13`                                                  |
| Font                                  | Plus Jakarta Sans           | via `next/font/google`                                     |
| Backend framework                     | Fastify                     | `^5.0.0` (catalog-pinned)                                  |
| Validation                            | Zod                         | `^3.23.8` (catalog-pinned)                                 |
| Logging/tracing                       | Pino + OpenTelemetry        | pino `^9.5.0`, `@opentelemetry/*` `^1.9.0`/`^0.54.0`       |
| PDF processing                        | pdf-lib (pure JS)           | `^1.17.1`                                                  |
| QR generation (server, unused by web) | `qrcode`                    | `^1.5.4`                                                   |
| QR generation (client, actually used) | `custom-qr-code` (MIT)      | `^2.0.3`                                                   |
| Testing                               | Vitest                      | `^2.1.3`                                                   |

## Repository

- GitHub: https://github.com/abdulazizatGitHub/zipply-tools
- Branch strategy (see [`.github/BRANCH_STRATEGY.md`](./.github/BRANCH_STRATEGY.md)):
  - `dev` — active development. CI runs quality checks only (lint, typecheck, test, format, tool
    manifests). No Docker build.
  - `preprod` — staging. Full quality checks + Docker build + push to
    `ghcr.io/abdulazizatgithub/zipply-*`. No deployment target configured yet.
  - `main` — production. Same as preprod plus `:latest` tags. Deployment to zipply.tools is not
    configured.
- Active branch: `dev`
- Flow: `feature work → dev → PR → preprod → PR → main`

## What is built and working

### Home page

`apps/web/src/app/page.tsx` — hero section, stats strip, a grid of the three live tools, a "how it
works" section, footer. Server-rendered, Tailwind-styled, emerald color system.

**Known copy bug:** the hero badge reads "2 tools live · 3 more shipping soon"
(`apps/web/src/app/page.tsx:103`) but the `LIVE_TOOLS` array on the same page already lists all
three tools (`pdf-merge`, `qr-generator`, `pdf-split`) as live. The copy hasn't been updated since
the third tool shipped.

### PDF Merge — fully functional end-to-end

- **Web:** `apps/web/src/app/pdf-merge/page.tsx` (SSR page, JSON-LD, FAQ, hreflang) +
  `pdf-merge-client.tsx` (drag-drop upload, reorder, merge, download UI).
- **Service:** `services/pdf-service/src/tools/pdf-merge/{manifest.ts,handler.ts,handler.test.ts}`.
  Conforms to `@toolforge/tool-contract`. Uses `pdf-lib` to concatenate PDFs.
- **Flow:** browser uploads each file via `POST {pdfServiceBase}/v1/_dev/files` (dev-only in-memory
  upload route, default `http://localhost:8081`) → browser calls
  `POST {apiBase}/v1/tools/pdf-merge/execute` (default `http://localhost:8080`) → api-gateway
  proxies to pdf-service → pdf-lib merges → response includes a `downloadUrl` served back through
  `pdf-service`'s dev file store.
- **Verified by:** `handler.test.ts` (unit test on the merge handler) + this is the only tool with a
  test file.
- Limits: 20 files, 50 MB total, 1 hour retention (in-memory only — see Known Issues).

### PDF Split — fully functional end-to-end

- Same architecture as PDF Merge: `apps/web/src/app/pdf-split/{page.tsx,pdf-split-client.tsx}` +
  `services/pdf-service/src/tools/pdf-split/{manifest.ts,handler.ts}`.
- **No test file** — unlike pdf-merge, pdf-split has no `handler.test.ts`.
- Splits by custom page ranges or one-file-per-page; 50 MB / 30-part limits.

### QR Generator — fully functional, entirely client-side

- `apps/web/src/app/qr-generator/{page.tsx,qr-client.tsx,qr-canvas.ts}`.
- **Renders entirely in the browser** using the `custom-qr-code` npm library (MIT license) — no
  network call to any backend for QR generation. See [DECISIONS.md](./DECISIONS.md) ADR-007 for why.
- Supports 6 dot styles, 3 corner styles, 9 frame templates (hand-drawn SVG wrappers — see ADR-005),
  8 social platform card presets (Instagram, TikTok, LinkedIn, X, Facebook, YouTube, WhatsApp,
  Linktree) with platform-brand recoloring, logo embedding, and 7 content types (URL, text, WiFi,
  vCard, email, phone, SMS).
- Downloads rasterize the assembled SVG to PNG via an offscreen `<canvas>`.
- **`services/qr-service` exists and is fully implemented** (real `qr-generate` tool using the
  `qrcode` npm package, conforms to `@toolforge/tool-contract`, reachable via api-gateway at
  `/v1/tools/qr-generate/execute`) — **but the web app never calls it.** It is live, tested-by-code,
  and currently unused dead weight from the product's perspective.
- Not yet available under `/[locale]/qr-generator` (see Known Issues).

### CI pipeline (`.github/workflows/ci.yml`)

Runs on push/PR to `main`, `preprod`, `dev`:

1. `setup` — `pnpm install --frozen-lockfile` + lockfile drift check.
2. `quality` matrix — `lint`, `typecheck`, `test`, `format:check` (affected-only via
   `--filter='[origin/main]'` on PRs, full run on pushes).
3. `deps` — circular-import check (`dpdm`) + multi-version `@toolforge/*` dependency check.
4. `manifests` — builds `@toolforge/tool-contract` then runs `tools/manifest-validator`, which
   validates every tool manifest in the repo against the Zod schema. A malformed manifest fails CI.
5. `build` — full `turbo run build`, only on push to `main`/`preprod`.
6. `ci-pass` — required aggregator check for branch protection.

### Docker images (`.github/workflows/docker.yml`)

Builds on push to `main`/`preprod` (path-filtered) for a 4-item matrix: `api-gateway`,
`pdf-service`, `qr-service` (services) and `web` (app). Pushes to
`ghcr.io/abdulazizatgithub/zipply-{name}` with `:latest`/`:{sha}` on `main` and
`:preprod`/`:preprod-{sha}` on `preprod`.

**Known gap:** `services/qr-service` has no `Dockerfile`. Only three Dockerfiles exist in the repo:
`apps/web/Dockerfile`, `services/api-gateway/Dockerfile`, `services/pdf-service/Dockerfile`. The
docker workflow's build matrix will fail on the `service/qr-service` job the next time it runs
against a path that triggers it.

### Brand / naming

"Zipply" is used consistently across all user-facing web copy (page titles, footers, metadata,
JSON-LD). Internal package scope (`@toolforge/*`) and the root package name (`toolforge`) were
deliberately kept — see ADR-006.

### License

`LICENSE` at repo root declares proprietary copyright for Zipply. Copyright header comments
(`Copyright (c) 2025 Zipply...`) are present in only **9 of 135** TypeScript/TSX source files —
specifically `apps/web/src/app/{layout,page}.tsx`, the three tool page/client files under
`apps/web/src/app/{pdf-merge,pdf-split,qr-generator}/`, and the three service entrypoints
(`services/{api-gateway,pdf-service,qr-service}/src/index.ts`). Everything in `packages/*` and the
rest of each service's source has no header. This looks like a partial rollout, not a deliberate
scope decision.

## What is NOT built (stubs only)

These exist as `package.json` + `README.md` only — **no `src/` directory at all**. Each README
states `Status: Foundation-phase placeholder. Phase 2 implementation.` and documents its intended
vendor boundary:

- `services/identity` — intended to wrap Clerk; owns `Principal`/`EntitlementCheck` contracts.
- `services/billing` — intended to wrap Stripe. Only service allowed to import the Stripe SDK.
- `services/metering` — intended for ClickHouse-backed usage events + Redis quota cache.
- `services/files` — intended to wrap Cloudflare R2 (S3-compatible fallback documented).
- `services/ai-gateway` — intended chokepoint for OpenAI/Anthropic calls; no AI tools exist yet.
- `services/seo-engine` — intended for programmatic sitemap/hreflang/JSON-LD generation at scale.
  (Today's SEO is hand-written per page via `@toolforge/seo-kit`, which is a real, working package.)
- `services/notifications` — intended for email/webhooks.
- `services/convert-service`, `services/image-service`, `services/dev-utils-service` — no tools
  implemented yet.
- `apps/admin`, `apps/docs` — no pages implemented.

**Downstream consequence:** because `services/identity` is a stub, api-gateway's auth middleware
(`services/api-gateway/src/auth/middleware.ts`) always falls back to an anonymous free-tier
`Principal` in every environment right now — there is no way to actually authenticate a request yet.
Because `services/metering` is a stub, both `pdf-service` and `qr-service` inject a **no-op**
metering client (`registry/platform-stubs.ts` in each service) — `ctx.metering.record(...)` calls in
tool handlers currently do nothing. The real, fully-implemented `@toolforge/metering-client` package
exists (fire-and-forget batching HTTP client) but isn't wired into either service.

The client packages for these stub services (`@toolforge/auth-client`, `@toolforge/billing-client`,
`@toolforge/files-client`, `@toolforge/ai-client`, `@toolforge/metering-client`) are **fully
implemented and tested** — they're just clients with nothing real to talk to yet.

## Architecture overview

Reality vs. the six-layer model in `PLATFORM_FOUNDATION.md` §2:

```
L6 Tool Surface     apps/web — 3 live tool pages + home page. REAL.
L5 Tool Contract    packages/tool-contract — manifest schema (Zod) + defineTool() + ToolContext.
                     REAL, and both live services conform to it.
L4 Platform Core    ALL STUBS except: seo-kit (real, used directly by web — no seo-engine service
                     exists), platform-client (real HTTP base used by all *-client packages).
L3 Processing Plane  pdf-service (REAL: pdf-merge, pdf-split) and qr-service (REAL: qr-generate,
                     but unused by the frontend) are implemented. image-service, convert-service,
                     dev-utils-service are stubs.
L2 Data Plane        Nothing real. pdf-service's "storage" is an in-process Map
                     (registry/files-memory.ts) — lost on restart, never touches R2/S3/Postgres.
L1 Infrastructure    Docker Compose for local dev (Postgres/Redis/MinIO/OTel-collector→Jaeger) —
                     see infra/docker-compose.yml. Nothing deployed to any cloud.
```

### Services and ports (local dev)

| Service       | Port | Real or stub                                           |
| ------------- | ---- | ------------------------------------------------------ |
| `web`         | 3000 | Real                                                   |
| `api-gateway` | 8080 | Real (proxy + auth middleware; auth backend is a stub) |
| `pdf-service` | 8081 | Real (pdf-merge, pdf-split)                            |
| `qr-service`  | 8082 | Real (qr-generate) but not called by the web app       |

### Request flow: web → api-gateway → service

`apps/web`'s PDF tool clients call the api-gateway directly with `fetch()` (no `@toolforge/*` client
package involved on the frontend — that's expected, `platform-client`/`*-client` packages are for
service-to-service Node code, not the browser). `api-gateway`'s `routes/proxy.ts` matches the
tool-id prefix (`pdf-` → `PDF_SERVICE_URL`, `qr-` → `QR_SERVICE_URL`) and forwards `GET /v1/tools`,
`GET /v1/tools/:id`, `POST /v1/tools/:id/execute`, stripping inbound `Authorization`/`x-api-key`
headers and injecting `x-toolforge-principal-id`/`x-toolforge-plan` from the resolved (currently
always-anonymous) principal.

### The Tool Contract in practice

Every tool is `parseToolManifest({...})` (validated Zod schema, see
`packages/tool-contract/src/manifest.ts`) + `defineTool({ manifest, input, output, execute })` (see
`packages/tool-contract/src/define.ts`). Each service's `ToolRegistry`
(`services/{pdf,qr}-service/src/registry/index.ts`) builds a `ToolContext` per invocation (injecting
`files`, `ai`, `metering`, `notifications`, `logger` — real or no-op depending on what's wired) and
dispatches to the handler. This part of the architecture matches `PLATFORM_FOUNDATION.md` §4 exactly
— it's the one piece of the original plan that was fully realized.

### Client-side vs. server-side: QR is the exception

Every other tool (PDF merge/split) does real work on the server. The QR generator is the deliberate
exception: all rendering (dot styles, frames, social cards, logo embedding) happens in the browser
via `custom-qr-code` and hand-written SVG in `apps/web/src/app/qr-generator/qr-canvas.ts`. Nothing
is uploaded, nothing is stored, no `qr-service` call happens. See ADR-007 in
[DECISIONS.md](./DECISIONS.md).

## Development setup

PowerShell-compatible. Node 22.x, pnpm 9.x, Docker required for local infra only.

```powershell
corepack enable
git clone https://github.com/abdulazizatGitHub/zipply-tools.git
cd zipply-tools
git checkout dev
pnpm install

docker-compose -f infra/docker-compose.yml up -d

pnpm --filter @toolforge/web --filter @toolforge/api-gateway --filter @toolforge/pdf-service --filter @toolforge/qr-service dev

pnpm validate
```

You do **not** need any cloud credentials (Clerk, Stripe, OpenAI, Vercel, Fly.io) to develop or run
`pnpm validate` locally — all of that is unimplemented, not just unconfigured.

## CI/CD status

- **`dev` branch:** CI runs quality checks (lint/typecheck/test/format) + dependency hygiene + tool
  manifest validation on every push and PR. No Docker build. This is currently green (see recent
  commit
  `790fa32 fix: add format:check to turbo pipeline, build tool-contract before manifest validation`,
  which fixed a prior CI ordering bug).
- **`preprod`/`main`:** additionally build Docker images and push to ghcr.io — **but this will fail
  for `qr-service`** because its Dockerfile doesn't exist (see Known Issues).
- No deployment step exists anywhere in the pipeline. Nothing auto-deploys after a successful build.

## Known issues (as of 2026-08-06)

1. **`services/qr-service` has no `Dockerfile`**, but `.github/workflows/docker.yml`'s build matrix
   includes it. The next push to `main`/`preprod` that triggers the docker workflow (path filters
   include `services/**`) will fail that job.
2. **Stale home page copy**: "2 tools live · 3 more shipping soon" while 3 tools are already listed
   as live (`apps/web/src/app/page.tsx:103`).
3. **`/[locale]/qr-generator` doesn't exist** — `apps/web/src/app/[locale]/` has `pdf-merge` and
   `pdf-split` but not `qr-generator`.
4. **Copyright headers are inconsistent** — present in 9 of 135 source files, mostly entrypoints and
   top-level web app files; absent from all of `packages/*` and most of each service's internals.
5. **Metering is fully no-op in both live services** — `noopMetering` stubs in
   `registry/platform-stubs.ts` mean no usage event has ever actually been recorded, despite
   `@toolforge/metering-client` being a complete, working package.
6. **Auth is unconditionally anonymous** — `services/identity` being a stub means `api-gateway`'s
   `authPreHandler` always resolves to the anonymous free-tier `Principal`, in every `NODE_ENV`,
   because `MemoryAuthClient` (the fallback used when `IDENTITY_BASE_URL` is unset) always rejects
   and the dev-mode catch swallows the error. There is currently no way to authenticate a real user
   against this codebase.
7. **File storage is ephemeral and dev-only** — `pdf-service`'s `/v1/_dev/files` route
   (`registry/files-memory.ts`) stores uploads in a plain in-process `Map`. Restarting the service
   loses every in-flight file. The code comments explicitly flag this route for removal once
   `services/files` is real — but `services/files` is still a stub, so there is no replacement path
   yet.
8. **`qr-service` is unused dead weight** — it's a fully working, tested service with its own Docker
   image, but the product never calls it. Every deploy of it (once its Dockerfile exists) ships and
   runs code that serves zero traffic.

## Deployment status

- **`dev`:** no deployment. CI quality checks only.
- **`preprod`:** Docker images built and pushed to `ghcr.io/abdulazizatgithub/zipply-*` on push
  (currently broken for `qr-service`, see Known Issues #1). No environment actually runs these
  images — "Preprod environment (when configured)" per `.github/BRANCH_STRATEGY.md`.
- **`main`:** same Docker build/push behavior with `:latest` tags. zipply.tools DNS is not
  configured. Nothing is running in production.
