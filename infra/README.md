# infra/

Platform infrastructure: Docker base strategy, local dev compose stack, OTel collector config, and
(Phase 2) Terraform modules for cloud resources.

| Path                  | Purpose                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `docker/`             | Shared Dockerfile templates and per-base images. See `docker/README.md`.                                                         |
| `docker-compose.yml`  | Local development stack: Postgres, Redis, MinIO, OTel collector, Jaeger. Brings up infra only — app services run via `pnpm dev`. |
| `otel/collector.yaml` | OTel collector pipeline for local dev. Staging/prod configs land Phase 2 once Grafana Cloud or Datadog is chosen.                |
| `terraform/`          | (Phase 2) cloud resource IaC — Cloudflare, Fly.io, managed Postgres, secrets.                                                    |

## Local dev — the 30-second story

```bash
# 1. Start infra
docker compose -f infra/docker-compose.yml up -d

# 2. Install deps
pnpm install

# 3. Boot app services from your editor
pnpm dev
```

That's it. No infra config in service repos. No secrets in env files committed to git. No bespoke
"run everything" scripts.
