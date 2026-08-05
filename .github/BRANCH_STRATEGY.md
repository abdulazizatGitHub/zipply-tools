# Zipply Branch Strategy

## Branches

### `dev`

- Purpose: Active development
- Who pushes: Developers directly or via feature branches
- CI: Quality checks (lint, typecheck, test, format, manifests)
- Docker: Not built
- Deployment: None — local dev only

### `preprod`

- Purpose: Staging and integration testing
- Who pushes: PRs from dev only (reviewed)
- CI: Full quality checks + Docker build + push to ghcr.io
- Docker tags: `preprod`, `preprod-{sha}`
- Deployment: Preprod environment (when configured)

### `main`

- Purpose: Production
- Who pushes: PRs from preprod only (reviewed + approved)
- CI: Full quality checks + Docker build + push to ghcr.io
- Docker tags: `latest`, `{sha}`
- Deployment: Production (zipply.tools) — configured at release

## Flow

```
feature work → dev → PR review → preprod → PR review → main
```

## Branch Protection Rules (configure manually on GitHub)

### `preprod`

- Require PR before merging
- Require `ci-pass` status check to pass
- Require 1 approving review
- No direct pushes

### `main`

- Require PR before merging
- Require `ci-pass` status check to pass
- Require 1 approving review
- Require branch to be up to date before merging
- No direct pushes
- No force pushes

## Docker Images

Registry: `ghcr.io/abdulazizatgithub/`

Images:

- `zipply-web` — Next.js web app
- `zipply-api-gateway` — Fastify API gateway
- `zipply-pdf-service` — PDF processing service
- `zipply-qr-service` — QR generation service

Tag strategy:

- `main` → `:latest` + `:{sha}`
- `preprod` → `:preprod` + `:preprod-{sha}`
- `dev` → not built
