# Contributing to ToolForge

## Setup

1. Install Node 22.x and pnpm 9.x. `nvm use` reads `.nvmrc`.
2. `pnpm install` — installs all workspaces.
3. `cp .env.example .env` and fill values needed for the services you'll run.
4. `pnpm dev` — runs all dev tasks via Turborepo.

## Development loop

```bash
pnpm --filter @toolforge/<package> dev       # run a single workspace in dev
pnpm --filter @toolforge/<package> test      # test a single workspace
pnpm --filter @toolforge/<package> typecheck # typecheck a single workspace
pnpm validate                                # full pre-PR check
```

## Adding a new package

Use the scaffolding CLI:

```bash
pnpm scaffold:tool
```

Or, for shared library packages, copy an existing `packages/*` as a template. Every package MUST:

- Be named `@toolforge/<kebab-name>`.
- Extend a `@toolforge/tsconfig` preset.
- Extend `@toolforge/eslint-config`.
- Use `@toolforge/prettier-config` (inherited from root).
- Export from `src/index.ts` only; internal files are private.
- Have a `package.json` `exports` field.
- Have at least one test under `src/**/*.test.ts`.

## Adding a new tool

Tools are NOT packages. They are entries in the tool registry that implement
`@toolforge/tool-contract`. The scaffolding CLI (Phase 2) generates the boilerplate:

```bash
pnpm scaffold:tool
```

A tool must declare a complete manifest (validated via Zod at build time) and implement the handler
interface.

## Commits

Conventional Commits. Examples:

```
feat(tool-contract): add streaming output kind
fix(telemetry): correctly propagate traceId through async hooks
docs(adr): record decision to defer Kubernetes
chore(deps): bump turbo to 2.3.0
```

Scope is the package or service. Subject is imperative, present tense, lowercase.

## Branching

- `main` is always deployable.
- Feature branches: `feat/<short-name>` or `fix/<short-name>`.
- PRs require: green CI, one approval, no unresolved review comments, conventional title.

## Architecture Decision Records

Anything that breaks or extends a platform standard requires an ADR.

```bash
cp docs/adr/_template.md docs/adr/NNNN-<short-name>.md
```

ADRs land in the same PR as the change they describe.

## Standards (the short list)

- **Strict TS, no `any` without justification.**
- **Zod at every trust boundary** (HTTP edge, DB read, env, queue payload).
- **OpenTelemetry for all logs/metrics/traces.** No `console.log` in services.
- **No raw `process.env`** — use `@toolforge/env`.
- **No direct vendor SDK calls** outside dedicated client packages.
- **No service-to-service mesh** — internal calls go through `api-gateway`.
- **Migrations are expand-migrate-contract.** Never break the read shape.
