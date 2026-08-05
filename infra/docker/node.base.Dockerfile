# syntax=docker/dockerfile:1.9
#
# Node base image. All Node-runtime services derive from this.
#
# Pinned to a specific Node version (LTS). Bumping is a platform decision —
# update both this file and .nvmrc / .node-version in the same PR.
#
# Uses bookworm-slim (Debian) rather than alpine for native module
# compatibility (sharp, native PDF libs). Image size cost ~50MB; worth it
# for sanity.

ARG NODE_VERSION=22.10.0
FROM node:${NODE_VERSION}-bookworm-slim

# Common runtime deps. Add per-service deps in the consuming Dockerfile.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      tini \
 && rm -rf /var/lib/apt/lists/*

# Corepack manages pnpm at the pinned version from package.json.
RUN corepack enable

# Non-root user — services NEVER run as root.
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs --home /app nodejs

# tini reaps zombies and forwards signals — important for graceful shutdown.
ENTRYPOINT ["/usr/bin/tini", "--"]

WORKDIR /app
USER nodejs
