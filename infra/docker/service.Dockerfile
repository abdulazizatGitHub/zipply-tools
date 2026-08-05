# syntax=docker/dockerfile:1.9
#
# Shared Node service Dockerfile template.
#
# This file is the canonical multi-stage build for any L4 / L3 Node service.
# Per-service Dockerfiles either reference it via `docker build -f` at the
# repo root, OR copy this layout and tweak only what's necessary.
#
# Build args:
#   SERVICE_NAME — package name under @toolforge/* (e.g. "api-gateway")
#   SERVICE_PATH — relative path from repo root (e.g. "services/api-gateway")
#   NODE_VERSION — Node major (pinned to .nvmrc / .node-version)
#   PORT         — service port (default 8080)
#
# Build from repo root:
#   docker build \
#     -f infra/docker/service.Dockerfile \
#     --build-arg SERVICE_NAME=api-gateway \
#     --build-arg SERVICE_PATH=services/api-gateway \
#     -t toolforge/api-gateway:dev \
#     .

ARG NODE_VERSION=22.10.0

# ============================================================================
# Stage 1: deps + build
# ============================================================================
FROM node:${NODE_VERSION}-bookworm-slim AS builder

ARG SERVICE_NAME
ARG SERVICE_PATH

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

# 1) Copy only the manifests first so dep install caches when source changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages
COPY tools ./tools

# Install all deps (workspace install resolves internal links).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Build the target plus its workspace deps.
RUN pnpm --filter "@toolforge/${SERVICE_NAME}..." build

# Produce a pruned, prod-only output (deploys without devDeps).
RUN pnpm --filter "@toolforge/${SERVICE_NAME}" deploy --prod /pruned

# ============================================================================
# Stage 2: runtime
# ============================================================================
FROM node:${NODE_VERSION}-bookworm-slim AS runtime

ARG PORT=8080
ENV NODE_ENV=production
ENV PORT=${PORT}
ENV NODE_OPTIONS="--enable-source-maps"

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates tini \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs --home /app nodejs

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /pruned/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /pruned/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /pruned/package.json ./package.json

USER nodejs
EXPOSE ${PORT}

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
# Services are expected to ship dist/instrumentation.js as the OTel preload.
CMD ["node", "-r", "./dist/instrumentation.js", "dist/index.js"]
