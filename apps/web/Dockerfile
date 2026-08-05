# syntax=docker/dockerfile:1.9
# apps/web image. Uses Next.js standalone output for minimal runtime.

ARG NODE_VERSION=22.10.0

# --- builder ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS builder

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

RUN pnpm --filter @toolforge/web... build

# --- runtime ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs --home /app nodejs \
 && apt-get update && apt-get install -y --no-install-recommends tini \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Next standalone copy: ./.next/standalone contains server.js + minimal deps.
# Static assets must be copied separately (Next does not include them in
# the standalone bundle).
COPY --from=builder --chown=nodejs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nodejs:nodejs /repo/apps/web/public ./apps/web/public

USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/web/server.js"]
