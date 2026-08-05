# @toolforge/qr-service

QR and barcode generation + decode. Lightweight; pure CPU.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Runtime decision (Phase 2):** Strong candidate for Cloudflare Workers (Edge runtime) —
generate-side is sub-millisecond and benefits from edge distribution. Decode requires WASM port of
zxing or similar.
