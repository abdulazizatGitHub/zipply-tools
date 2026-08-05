# syntax=docker/dockerfile:1.9
# api-gateway image.
# Built via the root infra/docker/service.Dockerfile pattern.
# Service-local Dockerfile here is intentionally a thin wrapper so per-service
# tweaks (build args, system deps) can land without forking the shared base.

ARG NODE_VERSION=22.10.0
ARG SERVICE_NAME=api-gateway
ARG SERVICE_PATH=services/api-gateway

# --- builder ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS builder
ARG SERVICE_PATH

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /repo

# Copy lockfile, workspace config, and all package.json for deterministic
# install. This layer caches as long as deps don't change.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages
COPY tools ./tools

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Build the target service plus its workspace deps.
RUN pnpm --filter "@toolforge/${SERVICE_PATH##*/}..." build

# Prune to production deps only.
RUN pnpm --filter "@toolforge/${SERVICE_PATH##*/}" deploy --prod /pruned

# --- runtime ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG SERVICE_PATH

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

# Non-root user — service must NOT run as root.
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs --home /app nodejs \
 && apt-get update && apt-get install -y --no-install-recommends tini \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /pruned/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /pruned/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /pruned/package.json ./package.json

USER nodejs
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start with the OTel preload loaded.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "-r", "./dist/instrumentation.js", "dist/index.js"]
