# syntax=docker/dockerfile:1.9
#
# Python base for L3 services that need Python (image-service variants,
# PDF/OCR, ML-driven tools). The polyglot tax is contained to this image
# and the consuming services.
#
# Pin Python version at the platform level; bumping is an ADR.

ARG PYTHON_VERSION=3.12-bookworm-slim
FROM python:${PYTHON_VERSION}

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      tini \
 && rm -rf /var/lib/apt/lists/*

# uv is the recommended fast installer for Python in this stack.
# https://github.com/astral-sh/uv
RUN pip install --no-cache-dir --root-user-action=ignore uv==0.4.20

RUN groupadd --system --gid 1001 python \
 && useradd  --system --uid 1001 --gid python --home /app python

WORKDIR /app
USER python

ENTRYPOINT ["/usr/bin/tini", "--"]
