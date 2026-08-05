# ToolForge — Engineering Manual

**Status:** Phase 1 (foundation complete). Phase 2 — first real tools — has not landed.
**Audience:** Engineers joining the platform. Read this once end-to-end; reference it later.

This is the operating manual for the repository. It tells you how to set up, where to look, what's
mandated, what's prohibited, and how to add things without breaking ecosystem consistency. If
something here disagrees with [`PLATFORM_FOUNDATION.md`](./PLATFORM_FOUNDATION.md), the constitution
wins — file an issue and we fix the manual.

---

## 1. Before you start

You need exactly these on your machine.

| Tool   | Version    | Why                                                                                |
| ------ | ---------- | ---------------------------------------------------------------------------------- |
| Node   | 22.x LTS   | Pinned via `.nvmrc` / `.node-version`. Use `nvm use` or `fnm use`.                 |
| pnpm   | 9.x        | Managed by Corepack — `corepack enable` once, version is pinned in `package.json`. |
| Docker | recent     | For the local infra stack (Postgres, Redis, MinIO, OTel).                          |
| Git    | any modern | The hooks (`lefthook`) install on `pnpm install`.                                  |

**Editor:** any editor with TypeScript LSP. VS Code users should accept the workspace TS version
prompt — the monorepo uses the pinned 5.6.x, not your global.

**You do NOT need:** AWS credentials, Stripe keys, OpenAI keys, Vercel, Fly.io, or any cloud account
to develop locally. All of that lands Phase 2 or later.

---

## 2. First-time setup — five minutes

```bash
# 1. Enable corepack so pnpm at the pinned version Just Works.
corepack enable

# 2. Clone and enter.
git clone <repo-url> toolforge && cd toolforge

# 3. Install all workspaces. This also installs the lefthook git hooks.
pnpm install

# 4. Start the local infra stack (Postgres, Redis, MinIO, OTel → Jaeger).
docker compose -f infra/docker-compose.yml up -d

# 5. Sanity check: lint, typecheck, test everything.
pnpm validate
```

If `pnpm validate` is green, you're ready. If not, see
[§9 When something breaks](#9-when-something-breaks).

The infra stack exposes:

| Service        | Port                              | UI                     |
| -------------- | --------------------------------- | ---------------------- |
| Postgres       | `5432`                            | —                      |
| Redis          | `6379`                            | —                      |
| MinIO          | `9000` (S3 API), `9001` (console) | http://localhost:9001  |
| Jaeger         | —                                 | http://localhost:16686 |
| OTel collector | `4317` (gRPC), `4318` (HTTP)      | —                      |

---

## 3. The daily loop

```bash
pnpm dev          # turbo runs every dev task in parallel (only services that have one)
pnpm build        # turbo runs every build task (services emit dist/, apps build .next)
pnpm validate     # full check: format + lint + typecheck + test
pnpm typecheck    # just typecheck across the graph
pnpm lint         # just lint
pnpm test         # just tests
pnpm format       # write Prettier across the repo
pnpm deps:graph   # fail on circular imports (CI runs this; rare to fail locally)
```

Run scoped commands when you don't need the whole graph:

```bash
pnpm --filter @toolforge/api-gateway dev          # just the api-gateway service
pnpm --filter @toolforge/web dev                  # just the web app
pnpm --filter @toolforge/tool-contract test       # just one package
pnpm --filter '@toolforge/api-gateway...' build   # api-gateway and everything it depends on
pnpm --filter '...@toolforge/tool-contract' lint  # tool-contract and everything depending on it
```

**Affected-only feedback:** CI uses `turbo run <task> --filter='[origin/main]'`. Locally you almost
never need this; pnpm filters above are usually faster.

---

## 4. Workspace topology — one diagram

```
toolforge/
├── apps/                 user-facing surfaces
│   ├── web/              Next.js — marketing, tool pages, app shell
│   ├── admin/            internal ops console (stub)
│   └── docs/             developer docs (stub)
├── services/             backend services
│   ├── api-gateway/      public ingress — Fastify (the template every later service copies)
│   ├── identity/         (stub) wraps Clerk → Ory
│   ├── billing/          (stub) Stripe boundary
│   ├── metering/         (stub) usage events → ClickHouse
│   ├── files/            (stub) R2/S3 boundary
│   ├── ai-gateway/       (stub) LLM chokepoint
│   ├── seo-engine/       (stub) programmatic SEO
│   ├── notifications/    (stub) email + webhooks
│   ├── pdf-service/      (stub) L3 processing
│   ├── image-service/    (stub) L3 processing
│   ├── qr-service/       (stub) L3 processing
│   ├── convert-service/  (stub) L3 processing
│   └── dev-utils-service/(stub) L3 processing
├── packages/             shared libraries
│   ├── tool-contract/    THE load-bearing standard for every tool
│   ├── platform-client/  base HTTP client (retries, traces, errors)
│   ├── auth-client/      typed client → identity service
│   ├── billing-client/   typed client → billing service
│   ├── files-client/     typed client → files service
│   ├── ai-client/        typed client → ai-gateway service
│   ├── metering-client/  fire-and-forget usage events
│   ├── telemetry/        OTel logger/tracer/metrics, Node SDK bootstrap
│   ├── env/              Zod-validated process.env
│   ├── errors/           shared error taxonomy
│   ├── events/           async event schema registry
│   ├── i18n/             locale routing primitives
│   ├── seo-kit/          JSON-LD, hreflang, sitemap helpers
│   ├── design-tokens/    color/type/spacing/motion source of truth
│   ├── ui/               React components (shadcn-style)
│   ├── sdk/              PUBLIC TypeScript SDK (the only npm-published package)
│   ├── test-utils/       shared fixtures and fakes
│   ├── tsconfig/         shared TS configs (base, node-service, react-library, nextjs)
│   ├── eslint-config/    flat configs (base, node, react, next)
│   └── prettier-config/  one config to rule them all
├── tools/                internal CLIs
│   ├── create-tool/      scaffolds a new tool conforming to the contract
│   └── manifest-validator/(stub) CI guardrail
└── infra/
    ├── docker/           shared Dockerfile templates
    ├── docker-compose.yml local dev infra
    ├── otel/             collector config for local
    └── terraform/        (stub) cloud IaC
```

**Rule of thumb for where new code goes:**

| You're building…                      | It goes in…                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------- |
| A new tool                            | `services/<existing-service>/src/tools/<tool-id>/` via `pnpm scaffold:tool` |
| A new platform service                | `services/<name>/` (use `api-gateway` as template)                          |
| Reusable code consumed by 2+ packages | `packages/<name>/`                                                          |
| A new CLI                             | `tools/<name>/`                                                             |
| A new user-facing app surface         | `apps/<name>/`                                                              |
| One-off scripts                       | NOT in the repo. Use a gist or your own folder.                             |

---

## 5. The contracts that matter

These four are load-bearing. Every other rule in this manual flows from them.

### 5.1 The Tool Contract — `@toolforge/tool-contract`

Every tool is a `parseToolManifest({...})` + `defineTool({...})` pair. Nothing else.

```ts
import { defineTool, parseToolManifest } from '@toolforge/tool-contract';
import { z } from 'zod';

export const manifest = parseToolManifest({
  id: 'pdf-merge',
  slug: 'pdf-merge',
  version: '0.1.0',
  category: 'pdf',
  display: { name: 'PDF Merge', tagline: '...', description: '...' },
  inputs: [{ name: 'files', kind: 'file', acceptMimeTypes: ['application/pdf'], required: true }],
  outputs: [{ name: 'merged', kind: 'file', mimeType: 'application/pdf' }],
  processing: { mode: 'sync', durationClass: 'lt-30s', runtime: 'node' },
  pricing: { tier: 'free' },
  seo: { titlePattern: 'Merge PDFs · ToolForge', descriptionPattern: '...', keywords: [] },
  i18n: { defaultLocale: 'en', supportedLocales: ['en'] },
  dependencies: { platformServices: ['files', 'metering'], externalServices: [] },
  policies: {
    maxInputBytes: 50 * 1024 * 1024,
    maxOutputBytes: 50 * 1024 * 1024,
    retentionSeconds: 24 * 60 * 60,
    syncTimeoutMs: 30_000,
  },
});

export default defineTool({
  manifest,
  input: z.object({
    /* validated input */
  }),
  output: z.object({
    /* validated output */
  }),
  async execute(input, ctx) {
    // Use ctx.files for I/O, ctx.metering.record for usage, ctx.ai for models.
    // Never import a vendor SDK directly.
  },
});
```

**What you may not do, ever:**

- Mutate platform state from a tool. The context is your only window.
- Read `process.env` from a tool.
- Import a vendor SDK from a tool (OpenAI, Stripe, S3 — these are walled off in the gateway
  services).
- Skip the manifest because "it's just a small tool." Tool #50 retrofitted is a quarter of platform
  engineering work.

### 5.2 The platform-client boundaries — `@toolforge/{auth,billing,files,ai,metering}-client`

Every internal service call goes through a client package. The HTTP base —
`@toolforge/platform-client` — handles retries with idempotency awareness, W3C trace propagation,
ProblemDetails error normalization, and timeouts. You inherit it for free.

**ESLint enforces the boundary.** This is not an honor system:

```js
// From packages/eslint-config/src/node.js
'no-restricted-imports': ['error', { paths: [
  { name: 'openai',            message: 'Use @toolforge/ai-client → ai-gateway.' },
  { name: '@anthropic-ai/sdk', message: 'Use @toolforge/ai-client → ai-gateway.' },
  { name: 'stripe',            message: 'Use @toolforge/billing-client → billing.' },
  { name: '@aws-sdk/client-s3', message: 'Use @toolforge/files-client → files.' },
]}]
```

The only files exempt are the corresponding owner services and clients (also enforced in the ESLint
override).

### 5.3 The env contract — `@toolforge/env`

You do not read `process.env` directly. Anywhere.

```ts
// services/<your-service>/src/env.ts
import { defineEnv, z } from '@toolforge/env';

export const env = defineEnv({
  service: 'your-service',
  schema: z.object({
    PORT: z.coerce.number().int().positive().default(8080),
    DATABASE_URL: z.string().url(),
    // ...
  }),
});
```

A malformed config fails the process at boot, not on the first request. Secrets are masked in error
output. The lint rule that blocks `process.env` lives in the shared node ESLint config; if you see
it tripping in legitimate code, file an ADR — don't add a `// eslint-disable`.

### 5.4 The telemetry contract — `@toolforge/telemetry`

```ts
import { createLogger, withSpan, getMeter } from '@toolforge/telemetry';

const logger = createLogger({ service: 'pdf-service' });
logger.info({ jobId }, 'processing started');

await withSpan('pdf.merge', async (span) => {
  span.setAttribute('input.count', files.length);
  // work
});
```

**`console.log` is a lint error in services.** Use the logger. It writes structured JSON, attaches
the current trace id, and routes through the OTel collector configured for the environment.

The OTel SDK bootstrap is preloaded by every service via:

```ts
// services/<name>/src/instrumentation.ts
import { startTelemetry } from '@toolforge/telemetry/node';
startTelemetry({ serviceName: 'your-service', serviceNamespace: 'toolforge' });
```

…and the `dev`/`start` scripts in `package.json` reference it with
`node -r ./dist/instrumentation.js`. Copy from `services/api-gateway/`.

---

## 6. How to add things

### 6.1 A new tool

```bash
pnpm scaffold:tool pdf-merge --service pdf-service --runtime node
```

This produces, inside the chosen service:

```
src/tools/pdf-merge/
  manifest.ts        ← parseToolManifest({...}) — already conforming
  handler.ts         ← defineTool({...}) — typed scaffold
  handler.test.ts    ← vitest skeleton
  index.ts           ← barrel
```

Fill in:

1. `manifest.ts` — `inputs`, `outputs`, `display`, `seo`, `policies`.
2. `handler.ts` — `input`/`output` Zod schemas matching the manifest, then `execute()`.
3. Tests.
4. (Phase 2) register in the service's tool registry. The registry pattern is part of the Phase 2
   service skeleton.

The scaffolded manifest already passes `parseToolManifest`. If it stops passing because you
tightened the contract, the scaffold breaks visibly — fix the templates in
`tools/create-tool/src/cli.ts`.

### 6.2 A new platform service

Copy `services/api-gateway/` and rename. Specifically copy:

- `package.json` (rename `name`, drop deps you don't need)
- `tsconfig.json` and `tsconfig.build.json`
- `eslint.config.js`
- `src/env.ts` (rewrite the schema)
- `src/instrumentation.ts` (change `serviceName`)
- `src/server.ts` (keep the plugins; replace routes)
- `src/index.ts` (keep verbatim — the graceful shutdown pattern is mandatory)
- `src/routes/health.ts` (keep verbatim — `/healthz` and `/readyz` are not optional)
- `Dockerfile` (rename ARGs)

Add the service to `commitlint.config.mjs` `scope-enum` and (when you have ops) `CODEOWNERS`.

**Do not improvise the boot sequence.** The order — instrumentation → env validation → server build
→ listen → SIGTERM handler — is the standard. Phase 2 reviews will reject services that deviate
without an ADR.

### 6.3 A new shared package

Copy an existing thin package — `packages/i18n/` is a good template. Files you need:

```
packages/<name>/
  package.json         (use catalog: refs; depend on @toolforge/* with workspace:*)
  tsconfig.json        (extends @toolforge/tsconfig/node-service.json)
  tsup.config.ts       (esm, dts, sourcemap, target node22)
  eslint.config.js     (re-exports the shared config)
  src/index.ts
```

After creating, run `pnpm install` once to refresh workspace links, then
`pnpm --filter @toolforge/<name> typecheck` to confirm it compiles.

**Internal vs. external packages:**

| If…                                             | Use…                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| Consumers are Node services (pre-built `dist/`) | `"main": "./dist/index.js"`, tsup build                                                |
| Consumers are Next.js apps or React-only        | `"main": "./src/index.ts"`, no build (transpilePackages does it) — see `@toolforge/ui` |
| The package is published to npm                 | tsup with `format: ['esm', 'cjs']`, treeshake, minify — see `@toolforge/sdk`           |

### 6.4 A new locale

Edit `packages/i18n/src/index.ts` — add the BCP-47 code to `SUPPORTED_LOCALES`. That's the only
declaration site. Re-build `@toolforge/i18n`. Translation catalogs go into the consuming app
(`apps/web/messages/<locale>.json` once Phase 2 wires next-intl or similar).

**Be deliberate.** Each locale multiplies the SEO surface. Adding one is a platform-team decision
and an ADR (Phase 2 process). Don't add Italian on a Tuesday because someone asked.

---

## 7. Standards — the short version

This is the enforcement layer. CI rejects PRs violating mandated rules; ESLint rejects them at PR
time.

| Concern           | Mandated                                    | Prohibited                                                            |
| ----------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| Language          | TS (Node) or Python (heavy processing only) | Anything else without an ADR                                          |
| Schema validation | Zod (TS) / Pydantic (Py)                    | Ad-hoc validation                                                     |
| Logging           | `@toolforge/telemetry` `createLogger`       | `console.log` in services                                             |
| Tracing           | OTel SDK loaded via `instrumentation.ts`    | Untraced cross-service HTTP                                           |
| Env               | `@toolforge/env` `defineEnv`                | Direct `process.env`                                                  |
| Auth              | `@toolforge/auth-client`                    | Direct Clerk/Ory SDK use (except inside `services/identity`)          |
| Files             | `@toolforge/files-client`                   | Direct R2/S3 SDK use (except inside `services/files`)                 |
| AI                | `@toolforge/ai-client`                      | Direct OpenAI/Anthropic SDK use (except inside `services/ai-gateway`) |
| Billing           | `@toolforge/billing-client`                 | Direct Stripe SDK use (except inside `services/billing`)              |
| Metering          | `@toolforge/metering-client`                | Untracked usage                                                       |
| CSS               | Tailwind via design-tokens                  | CSS-in-JS in new components                                           |
| Commits           | Conventional commits with scope             | `chore: stuff`                                                        |
| Branch            | One PR per logical change                   | Mega-PRs spanning multiple boundaries                                 |

**Exception process:** open a 1-page ADR in `docs/adr/` (Phase 2 will scaffold this directory).
Platform-team review within 5 business days. No silent deviations.

---

## 8. Running services in Docker

You generally don't need to. `pnpm dev` runs services natively against the docker-compose infra —
much faster feedback. Use Docker for:

- **Reproducing a CI image build failure.**
- **Smoke-testing a Dockerfile change.**
- **Local end-to-end-ish testing before a release.**

Build a service image from the repo root:

```bash
# Build api-gateway using the shared template:
docker build \
  -f infra/docker/service.Dockerfile \
  --build-arg SERVICE_NAME=api-gateway \
  --build-arg SERVICE_PATH=services/api-gateway \
  -t toolforge/api-gateway:dev \
  .

# Or use the per-service Dockerfile (which is just a thin wrapper):
docker build -f services/api-gateway/Dockerfile -t toolforge/api-gateway:dev .

# Run it against the local infra (compose network):
docker run --rm --network=toolforge_default \
  -p 8080:8080 \
  --env-file services/api-gateway/.env.example \
  toolforge/api-gateway:dev
```

The web app uses Next.js standalone output:

```bash
docker build -f infra/docker/web.Dockerfile --build-arg APP_NAME=web -t toolforge/web:dev .
```

All images run as non-root (`uid 1001`), under `tini`, with a `HEALTHCHECK` on `/healthz`. If you
find yourself wanting to run as root or skip the healthcheck — stop, file an ADR, name what you're
optimizing for.

---

## 9. CI/CD — what runs and when

Defined in `.github/workflows/ci.yml` and `.github/workflows/docker.yml`.

**On every PR to `main`:**

1. **setup** — pnpm install + lockfile drift check
2. **quality matrix** (parallel) — `lint`, `typecheck`, `test`, `format:check` — affected-only via
   `--filter='[origin/main]'`
3. **deps** — `dpdm` circular-dep check + multi-version detection for `@toolforge/*` deps
4. **ci-pass** — aggregator job that branch protection requires

**On push to `main` (and merge_group):**

- Everything above, **plus full builds** (no affected-only — refreshes Turbo remote cache).
- **Docker image builds** for `api-gateway` and `web` (Phase 2 expands the matrix).

**Required for merge:** the `ci pass` check must be green. Direct push to `main` is blocked —
everything goes through PR. Branch protection should require at least one approving review from
CODEOWNERS for the affected paths.

**Cache discipline:**

- pnpm store is cached on the `pnpm-lock.yaml` hash.
- Turbo cache is keyed by `(task, ref, sha)` with `main`-prefixed fallback. PR CI almost always hits
  warm cache for unrelated tasks.
- If a CI run looks suspiciously slow, the cache fallback chain probably missed. Look for a recent
  `pnpm-lock.yaml` churn.

---

## 10. When something breaks

| Symptom                                     | Likely cause                                    | Fix                                                                                                     |
| ------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm install` fails with "only-allow pnpm" | You ran `npm install` or `yarn`                 | Delete `node_modules`, run `pnpm install`                                                               |
| `ERR_INVALID_THIS` / Corepack mismatch      | `pnpm` global version mismatches the pinned one | `corepack enable && corepack prepare pnpm@9.12.3 --activate`                                            |
| Lefthook didn't install                     | `pnpm install` ran but `prepare` didn't fire    | `pnpm exec lefthook install` once                                                                       |
| TS errors only in editor, fine on CLI       | Editor using its own TS instead of workspace    | "TypeScript: Use Workspace Version" in VS Code                                                          |
| Cannot find `@toolforge/<x>`                | Workspace not re-linked after a new package     | `pnpm install` from the repo root                                                                       |
| `docker compose up` hangs                   | Previous stack still running                    | `docker compose -f infra/docker-compose.yml down -v`                                                    |
| `pnpm dev` says port 8080/3000 busy         | Stale process or compose mapping                | `lsof -i :8080` then `kill`, or change `PORT` in `.env`                                                 |
| `dpdm` fails on a new package               | You introduced a circular import                | Refactor — one of the packages probably wants to be split                                               |
| ESLint complains about `openai`             | You imported a vendor SDK outside its boundary  | Use `@toolforge/ai-client`. If you genuinely need vendor access, you're working in the gateway service. |
| `pnpm validate` is slow                     | Cold Turbo cache                                | Run once to warm. Repeated runs hit cache.                                                              |

If none of these fits, open an issue with the failing command + first 100 lines of output. Do not
silently `// eslint-disable` or `@ts-expect-error` your way past a check — that's what 80% of
monorepo decay looks like by month 6.

---

## 11. Where to look — the file map

| If you need to…                        | Read…                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Understand the strategic decisions     | [`PLATFORM_FOUNDATION.md`](./PLATFORM_FOUNDATION.md)                                                        |
| See the workspace shape                | [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) and [§4 above](#4-workspace-topology--one-diagram)           |
| Add or change shared deps              | [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) `catalog:` block                                             |
| Tune CI                                | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)                                                    |
| Tune Turbo tasks                       | [`turbo.json`](./turbo.json)                                                                                |
| See the contract every tool implements | [`packages/tool-contract/src/`](./packages/tool-contract/src/)                                              |
| Copy the canonical service skeleton    | [`services/api-gateway/`](./services/api-gateway/)                                                          |
| Understand the OTel preload            | [`packages/telemetry/src/node.ts`](./packages/telemetry/src/node.ts) and any service's `instrumentation.ts` |
| Understand env validation              | [`packages/env/src/index.ts`](./packages/env/src/index.ts)                                                  |
| Add a new commit scope                 | [`commitlint.config.mjs`](./commitlint.config.mjs)                                                          |
| Change the Docker base                 | [`infra/docker/`](./infra/docker/) — see [`infra/docker/README.md`](./infra/docker/README.md)               |
| Add a CODEOWNER                        | [`.github/CODEOWNERS`](./.github/CODEOWNERS)                                                                |

---

## 12. The one-paragraph operating principle

**Build for tool #50, not tool #1.** Every shortcut that saves a day now costs a week per service
later. The Tool Contract, the platform clients, the env validator, the telemetry preload, the
service skeleton — these exist so the answer to "how do I do X?" is the same on day 30 and day 730.
When you find yourself wanting to deviate, you're almost certainly proposing the kind of shortcut
Phase 1 was built to prevent. Open an ADR; let the platform team disagree publicly; then either ship
the deviation with a documented exception or ship the conforming version.

If you remember nothing else from this document, remember that.
