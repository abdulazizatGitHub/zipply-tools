# Zipply — Agent Instructions

Last updated: 2026-08-06

## Read this before touching any code

Read [ZIPPLY_CONTEXT.md](./ZIPPLY_CONTEXT.md) first — it describes what actually exists. Then read
this file. Then check [NEXT_STEPS.md](./NEXT_STEPS.md) for what to work on. Then start.

## How this project is structured

Standard Turborepo/pnpm-workspace layout — `apps/`, `services/`, `packages/`, `tools/`, `infra/`.
Nothing outside those four workspace directories is a package (`pnpm-workspace.yaml` enforces this).
See `MANUAL.md` §4 for the full topology diagram — it's accurate for directory shape, but many of
the services and both non-web apps it lists are stubs (see ZIPPLY_CONTEXT.md).

## The branch you should work on

Always work on `dev` unless told otherwise. Never push directly to `preprod` or `main` — both
require PRs with review per `.github/BRANCH_STRATEGY.md`.

## Before writing any code

1. Read `ZIPPLY_CONTEXT.md` — understand what exists.
2. Read `NEXT_STEPS.md` — understand what's next.
3. Confirm you're on `dev`: `git branch --show-current`.
4. Run `pnpm validate` — confirm the baseline is green before you start.

## How to add a new tool

1. `pnpm scaffold:tool <tool-id> --service <pdf-service|qr-service|...> --runtime node` — generates
   `src/tools/<id>/{manifest.ts,handler.ts,handler.test.ts,index.ts}` inside the chosen service. The
   scaffold validates the manifest through `parseToolManifest` before writing anything to disk.
2. Fill in `manifest.ts` (`inputs`, `outputs`, `display`, `seo`, `policies`) — copy the shape from
   `services/pdf-service/src/tools/pdf-merge/manifest.ts`.
3. Fill in `handler.ts` — Zod `input`/`output` schemas + `execute()`. Use `ctx.files`,
   `ctx.metering`, `ctx.ai`, `ctx.logger` from the injected `ToolContext` — **never** import a
   vendor SDK or read `process.env` directly from a handler. Copy the shape from
   `services/pdf-service/src/tools/pdf-merge/handler.ts`.
4. Write a test — `pdf-merge/handler.test.ts` is the only existing example to copy from (`pdf-split`
   shipped without one; don't repeat that gap).
5. Register the tool in the service's `src/tools/index.ts` barrel so the registry loads it at boot.
6. Add a page under `apps/web/src/app/<tool-slug>/` — copy `apps/web/src/app/pdf-merge/` for a
   server-processed tool, or `apps/web/src/app/qr-generator/` for a fully client-side tool.
7. Add the tool's path to `apps/web/src/app/sitemap.ts`'s `TOOL_PAGES` array.

## Hard rules (non-negotiable)

1. Every tool is `parseToolManifest()` + `defineTool()` — no exceptions.
2. No vendor SDK outside its boundary service (Stripe only in `services/billing`, Clerk only in
   `services/identity`, OpenAI/Anthropic only in `services/ai-gateway`, R2/S3 only in
   `services/files`). These services are stubs today — that does not mean it's OK to call a vendor
   SDK from somewhere else "just for now." Build the stub out, or use the existing typed client
   package and accept it currently talks to nothing.
3. No `process.env` outside `@toolforge/env`'s `defineEnv()`.
4. No `console.log` in services — use `createLogger` from `@toolforge/telemetry`.
5. No new packages outside `apps/`, `services/`, `packages/`, `tools/`, `infra/`.
6. Run `pnpm validate` before every commit — it must pass.
7. Use conventional commits: `feat/fix/chore/refactor/docs/style/perf/test(scope): subject`.
8. Never commit `.env` files with real values — only `.env.example` files documenting variable
   _names_ and shapes.

## How the QR tool works (important — it is client-side)

`apps/web/src/app/qr-generator/qr-canvas.ts` does all QR rendering in the browser using the
`custom-qr-code` npm library (MIT license) plus hand-written SVG for frames and social cards. It
does **not** call `services/qr-service` for generation. `services/qr-service` exists, is fully
implemented, and is reachable via `api-gateway` at `/v1/tools/qr-generate/execute` — it's just not
used by the product today. See ADR-007 in `DECISIONS.md` for the reasoning (no round-trip latency,
works offline, no server load). If you're asked to add a QR feature, default to extending
`qr-canvas.ts` client-side rather than routing through `qr-service`, unless the feature genuinely
requires server-side state or a capability the browser can't provide.

## How the PDF tools work

Browser → `POST {pdfServiceBase}/v1/_dev/files` (dev-only in-memory upload, gated by
`ENABLE_DEV_UPLOAD_ROUTE`) → browser → `POST {apiBase}/v1/tools/<tool-id>/execute` → `api-gateway`
(`routes/proxy.ts`, prefix-matches `pdf-`/`qr-` to resolve the upstream) → `pdf-service` runs the
tool via its `ToolRegistry` → response includes a `downloadUrl` served back from the same in-memory
store. In production this whole file path needs `services/files` to be real — it currently is not,
so nothing here survives a service restart. Don't build more functionality on top of the in-memory
store as if it were permanent storage; if a task requires persistent files, that's a signal you've
hit the `services/files` gap and should surface it rather than working around it locally.

## Current stub services

`identity`, `billing`, `metering`, `files`, `ai-gateway`, `seo-engine`, `notifications`,
`convert-service`, `image-service`, `dev-utils-service` — each is `package.json` + `README.md` only.
Each README states its intended vendor and boundary; read the specific service's README before
implementing it for real. Do not invent a different vendor or pattern than what the README describes
without writing an ADR first (see `DECISIONS.md`).

Two consequences worth knowing before you touch auth or metering code:

- **Auth is unconditionally anonymous** right now (`identity` is a stub, so `api-gateway`'s
  `authPreHandler` always falls back to an anonymous `Principal`). Don't assume any request carries
  a real authenticated user.
- **Metering is a no-op** in both live services (`registry/platform-stubs.ts` in each). The real
  `@toolforge/metering-client` package works and is unused — wiring it in is part of Phase 2 M4, not
  something to bolt on ad hoc inside a tool handler.

## Testing

- Unit tests: `pnpm turbo run test`
- Full validation: `pnpm validate` (format:check + lint + typecheck + test)
- Manual browser testing:
  `pnpm --filter @toolforge/web --filter @toolforge/api-gateway --filter @toolforge/pdf-service --filter @toolforge/qr-service dev`,
  then open `localhost:3000`.

## Commit and push process

```powershell
# On dev branch
git add -A
git status  # review what you are committing
git commit -m "type(scope): description"
git push origin dev
```

## What requires human operator action

- Creating cloud accounts (Fly.io, Vercel, Cloudflare, Clerk, Neon, Upstash, Sentry, Grafana Cloud,
  Doppler/Infisical, etc.)
- Spending money
- DNS changes for zipply.tools
- Pushing to `preprod` or `main` branches
- Any production deployment
- Registering the `services/qr-service` Docker image fix is code-only and does _not_ need operator
  action — don't defer that one unnecessarily.
