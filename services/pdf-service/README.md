# @toolforge/pdf-service

PDF processing — merge, split, compress, convert, OCR. Implements tools that conform to
`@toolforge/tool-contract`. Heavy native deps (Ghostscript, qpdf, OCRmyPDF) — Python tier or Node
with native bindings.

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**Runtime decision (deferred to Phase 2):** Node + native bindings, OR a Python (FastAPI) sidecar
invoked from a Node coordinator. Decision lands as an ADR once the first three PDF tools'
performance envelopes are measured.

**Queue isolation:** PDF jobs must NOT share a queue with image or convert jobs. Head-of-line
blocking is the most likely throughput failure.
