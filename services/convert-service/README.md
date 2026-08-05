# @toolforge/convert-service

Document and data format conversions — LibreOffice headless, pandoc, ffmpeg where applicable. The
heaviest L3 service by image size and per-job memory.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Operational note:** the LibreOffice base image alone is ~1.5GB. Pull-time matters. Treat this
image specially in CI — build once per main commit, not per PR.

**Isolation:** convert jobs MUST run on dedicated workers with a separate queue. They are the most
likely to OOM or hit timeout.
