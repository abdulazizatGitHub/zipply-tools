# Zipply — Progress Tracker

Last updated: 2026-08-08. See [ZIPPLY_CONTEXT.md](./ZIPPLY_CONTEXT.md) for full detail behind every
line here.

## Phase 1: Foundation (COMPLETE)

Every package and service, rated by what actually exists on disk (`src/` contents), not by intent.

### `packages/*`

| Package                                        | Status   | Note                                                                                                                                                           |
| ---------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tool-contract`                                | COMPLETE | The load-bearing standard. Both live services conform to it.                                                                                                   |
| `platform-client`                              | COMPLETE | Shared HTTP base (retries, trace propagation, ProblemDetails errors).                                                                                          |
| `auth-client`                                  | COMPLETE | Typed client; backing `identity` service is a stub.                                                                                                            |
| `billing-client`                               | COMPLETE | Typed client; backing `billing` service is a stub.                                                                                                             |
| `files-client`                                 | COMPLETE | Typed client; backing `files` service is a stub.                                                                                                               |
| `ai-client`                                    | COMPLETE | Typed client; backing `ai-gateway` service is a stub.                                                                                                          |
| `metering-client`                              | COMPLETE | Fire-and-forget batching HTTP client — fully implemented, but not wired into `pdf-service`/`qr-service` (they use a local no-op instead).                      |
| `telemetry`                                    | COMPLETE | OTel logger/tracer/metrics, Node SDK bootstrap. Used by all real services.                                                                                     |
| `env`                                          | COMPLETE | Zod-validated `process.env` wrapper (`defineEnv`).                                                                                                             |
| `errors`                                       | COMPLETE | Shared error taxonomy (`ValidationError`, etc.).                                                                                                               |
| `events`                                       | COMPLETE | Envelope schema + `tool.*`/`file.*`/`billing.*` event registry. Not yet actually published anywhere (no queue/bus wired up).                                   |
| `i18n`                                         | COMPLETE | Locale routing primitives; only `en` is a supported/curated locale today.                                                                                      |
| `seo-kit`                                      | COMPLETE | JSON-LD, hreflang helpers — used directly by every tool page.                                                                                                  |
| `design-tokens`                                | COMPLETE | Color/type/spacing source of truth.                                                                                                                            |
| `ui`                                           | PARTIAL  | Only 36 lines across 3 files — mostly a shared stylesheet. The web app builds almost all UI directly in `apps/web`, not via shared `@toolforge/ui` components. |
| `sdk`                                          | COMPLETE | Public TS SDK package; not published to npm yet.                                                                                                               |
| `test-utils`                                   | COMPLETE | Shared fixtures/fakes.                                                                                                                                         |
| `eslint-config`, `prettier-config`, `tsconfig` | COMPLETE | Config-only packages (no `src/` expected — this is correct, not a stub).                                                                                       |

### `services/*`

| Service             | Status                   | Note                                                                                                                                                                                                                     |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api-gateway`       | COMPLETE (as a skeleton) | Real Fastify service: env validation, OTel preload, graceful shutdown, `/healthz`+`/readyz`, auth preHandler, proxy routing to `pdf-`/`qr-` prefixed tools. Auth always resolves anonymous because `identity` is a stub. |
| `pdf-service`       | COMPLETE                 | Real tool registry pattern + `pdf-merge` and `pdf-split` tools (pdf-lib). In-memory dev-only file store.                                                                                                                 |
| `qr-service`        | COMPLETE, but unused     | Real tool registry + `qr-generate` tool (`qrcode` npm lib). Not called by the web app; still missing a Dockerfile, and intentionally excluded from the CI Docker matrix until it has one (see `DECISIONS.md` ADR-007).   |
| `identity`          | STUB                     | `package.json` + `README.md` only.                                                                                                                                                                                       |
| `billing`           | STUB                     | Same.                                                                                                                                                                                                                    |
| `metering`          | STUB                     | Same.                                                                                                                                                                                                                    |
| `files`             | STUB                     | Same.                                                                                                                                                                                                                    |
| `ai-gateway`        | STUB                     | Same.                                                                                                                                                                                                                    |
| `seo-engine`        | STUB                     | Same — SEO today is hand-built per page via `seo-kit`, not a service.                                                                                                                                                    |
| `notifications`     | STUB                     | Same.                                                                                                                                                                                                                    |
| `convert-service`   | STUB                     | Same.                                                                                                                                                                                                                    |
| `image-service`     | STUB                     | Same.                                                                                                                                                                                                                    |
| `dev-utils-service` | STUB                     | Same.                                                                                                                                                                                                                    |

### `apps/*`

| App     | Status  | Note                                                                                                                                   |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `web`   | PARTIAL | Home page + 3 tool pages fully built. `/[locale]/qr-generator` missing. `admin`/`docs` links don't exist because those apps are stubs. |
| `admin` | STUB    | `package.json` + `README.md` only.                                                                                                     |
| `docs`  | STUB    | Same.                                                                                                                                  |

### `tools/*` (internal CLIs)

| Tool                 | Status   | Note                                                                          |
| -------------------- | -------- | ----------------------------------------------------------------------------- |
| `create-tool`        | COMPLETE | Scaffolds a new tool, validates the manifest via Zod before writing to disk.  |
| `manifest-validator` | COMPLETE | Wired into CI (`ci.yml` `manifests` job) — a malformed manifest fails the PR. |

## Phase 2: Tools and Launch Preparation (IN PROGRESS)

`AGENT_PROMPT_PHASE_2.md` defines a 14-milestone (M1–M14) plan with a formal Definition of Done. No
`PHASE_2_PLAN.md` has been written and none of the 14 milestones are complete — this phase has been
worked informally/directly rather than through that process.

### Completed in Phase 2 so far

- `pdf-merge` and `pdf-split` shipped end-to-end (upload → process → download) against the dev-only
  in-memory file store, proxied through `api-gateway`.
- `qr-generate` service built (though not consumed by the frontend).
- QR Generator built as a fully client-side tool: 6 dot styles, 3 corner styles, 9 frame templates,
  8 social platform presets, logo embedding, 7 content-type formatters.
- Web app redesign: emerald color system, mobile-responsive layouts (commit `644b971`). **Note:**
  the brand primary has since moved to Penn Blue `#141E5A` (superseding emerald — see `DECISIONS.md`
  ADR-004), but that migration into `@toolforge/design-tokens` and the rendered site is still
  outstanding.
- CI pipeline hardening: `format:check` added to the turbo pipeline, `tool-contract` now builds
  before `manifest-validator` runs (commit `790fa32`).
- Branch strategy and Docker workflow configured for `dev`/`preprod`/`main` (commit `b7d18e0`).
- Proprietary license added; partial copyright header rollout (commit `10249f4`).
- Zipply branding applied across all user-facing web copy.

### In progress / partially done

- Docker image matrix — all 3 currently-included entries (`api-gateway`, `pdf-service`, `web`) have
  Dockerfiles; `qr-service` is intentionally excluded until it gets one (see `DECISIONS.md`
  ADR-007).
- Locale-routed pages — `pdf-merge` and `pdf-split` exist under `[locale]/`, `qr-generator` doesn't.
- Copyright header rollout — 9 of 135 source files have the header.

### Not started (from `AGENT_PROMPT_PHASE_2.md`'s M1–M14 / Definition of Done)

- M1 — Cloud accounts + secrets workspace (Doppler/Infisical, Clerk, Cloudflare, Fly, Neon, Upstash,
  Sentry, Grafana Cloud). Nothing provisioned.
- M2 — Real `identity` service (Clerk-backed).
- M3 — Real `files` service (R2-backed).
- M4 — Real `metering` service (ClickHouse/Postgres-backed) + wiring `@toolforge/metering-client`
  into `pdf-service`/`qr-service` in place of the current no-op.
- M7 — api-gateway auth actually enforcing (currently unconditionally anonymous) + real rate limits.
- M9 — Programmatic SEO beyond hand-written per-page metadata (`seo-engine` doesn't exist).
- M10 — Observability backend (Grafana Cloud/Datadog). Local OTel collector → Jaeger exists in
  `infra/docker-compose.yml`; nothing ships anywhere outside a developer's machine.
- M12/M13 — Production deploy infrastructure and pipeline. `infra/terraform` is a README-only stub.
- M14 — Feature flags (PostHog/LaunchDarkly) + first real user + `RUNBOOK_FIRST_TOOL.md`. None
  exist.
- `docs/adr/` — referenced by `CONTRIBUTING.md` and `MANUAL.md` as the ADR home; directory doesn't
  exist yet (this repo's actual architectural decisions are recorded in
  [DECISIONS.md](./DECISIONS.md) instead, informally).

## Phase 3: Deployment (NOT STARTED)

- [ ] Cloud accounts setup (Fly.io for services, Vercel for web)
- [ ] Environment variables management (Doppler or equivalent)
- [ ] DNS configuration for zipply.tools
- [ ] Real backing services (identity via Clerk, files via R2, metering via ClickHouse or Postgres
      bridge)
- [ ] Observability (OTel traces to Grafana Cloud)
- [ ] Feature flags (PostHog)
- [ ] Deploy pipeline (GitHub Actions → Fly.io + Vercel)
- [ ] Runbook written
- [ ] `services/qr-service/Dockerfile` created so it can be added back to the docker build matrix
      and actually get deployed

## Phase 4: Growth Tools (FUTURE)

- PDF Compress
- Image Resize
- More QR templates

## Phase 5: Monetization (FUTURE)

Billing, Stripe, paid plans — deliberately deferred. `services/billing` and
`packages/billing-client` exist as a contract only.

## Priority order for next work

Priority order lives in [NEXT_STEPS.md](./NEXT_STEPS.md) — this file tracks phase/status, not
ordering. Don't restate a priority list here; update NEXT_STEPS.md instead.
