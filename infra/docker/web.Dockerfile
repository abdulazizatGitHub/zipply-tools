# syntax=docker/dockerfile:1.9
#
# Shared web (Next.js) Dockerfile template. Uses standalone output for a
# minimal runtime image (~150MB vs ~600MB for full node_modules).
#
# Build args:
#   APP_NAME — package name under @toolforge/* (e.g. "web", "admin", "docs")
#
# Build from repo root:
#   docker build \
#     -f infra/docker/web.Dockerfile \
#     --build-arg APP_NAME=web \
#     -t toolforge/web:dev \
#     .

ARG NODE_VERSION=22.10.0

# --- builder ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS builder
ARG APP_NAME

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages
COPY tools ./tools

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm --filter "@toolforge/${APP_NAME}..." build

# --- runtime ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG APP_NAME

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates tini \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs --home /app nodejs

WORKDIR /app

# Next.js standalone server is at apps/${APP_NAME}/.next/standalone/apps/${APP_NAME}/server.js
COPY --from=builder --chown=nodejs:nodejs /repo/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /repo/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=nodejs:nodejs /repo/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "node apps/${APP_NAME}/server.js"]
