# syntax=docker/dockerfile:1.9
# pdf-service image — Node 22 + pdf-lib (pure JS, no native binaries).
# Native PDF tools (Ghostscript, qpdf, OCRmyPDF) land later via an ADR.

ARG NODE_VERSION=22.10.0
ARG SERVICE_NAME=pdf-service
ARG SERVICE_PATH=services/pdf-service

FROM node:${NODE_VERSION}-bookworm-slim AS builder
ARG SERVICE_PATH

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages
COPY tools ./tools

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm --filter "@toolforge/${SERVICE_PATH##*/}..." build

RUN pnpm --filter "@toolforge/${SERVICE_PATH##*/}" deploy --prod /pruned

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG SERVICE_PATH

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs --home /app nodejs \
 && apt-get update && apt-get install -y --no-install-recommends tini \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /pruned/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /pruned/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /pruned/package.json ./package.json

USER nodejs
EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://localhost:8081/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "-r", "./dist/instrumentation.js", "dist/index.js"]
