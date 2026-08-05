# Docker base strategy

Four base templates. Every service Dockerfile is either a thin wrapper around one of these or — with
a documented reason in the service README — a divergence from one.

| Template                 | For                                                                                                                                                                         | Notes                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `node.base.Dockerfile`   | Reference base image — most services don't reference this directly; included for consistency and to document the runtime choices (debian-slim over alpine, tini, non-root). |
| `service.Dockerfile`     | Every Node L4/L3 service                                                                                                                                                    | Multi-stage; produces a pruned prod-only image. Build from repo root with `--build-arg SERVICE_NAME=...`. |
| `web.Dockerfile`         | Every Next.js app (`web`, `admin`, `docs`)                                                                                                                                  | Standalone output. Build from repo root with `--build-arg APP_NAME=...`.                                  |
| `python.base.Dockerfile` | L3 services on the Python tier (heavy PDF/image/ML)                                                                                                                         | uv-installer-equipped; non-root; tini-supervised.                                                         |

## Hard rules

1. **Never run as root.** All bases set up a non-root user.
2. **Never bake secrets into images.** Secrets come from Doppler/Infisical at runtime.
3. **Always pin Node and Python versions** in this directory; bumps are platform decisions, not
   per-service.
4. **Always provide a HEALTHCHECK.** Container orchestrators rely on it.
5. **Always run under tini** (or equivalent init). Otherwise SIGTERM doesn't propagate properly and
   graceful shutdown fails.

## Per-service Dockerfile pattern

Service-local Dockerfiles can either:

- Reference the shared template directly via
  `docker build -f infra/docker/service.Dockerfile --build-arg SERVICE_NAME=<name> .`, OR
- Inline the multi-stage recipe (copying from the template) when the service needs custom system
  packages (e.g. `convert-service` installs LibreOffice).

Inlined Dockerfiles must include a comment block at the top stating **which template they diverged
from and why**. PR review checks for this.
