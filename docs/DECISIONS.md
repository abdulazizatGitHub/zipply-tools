# Zipply — Decision Log

## How to read this

Each decision has: the question, what was decided, why, and what was rejected. New decisions are
added at the top (newest first). This log exists because `CONTRIBUTING.md` and `MANUAL.md` both
reference a formal `docs/adr/` process that was never instantiated — this file is the actual record
of decisions made in this repository so far. If `docs/adr/` gets created later, migrate these in.

---

## ADR-008: Success/positive states are navy, not green; tool-page footer stays distinct from home's

Date: 2026-08-14 Status: Decided

**Question (part 1):** What color should "success"/"ready"/"complete" states use — the dormant
`success` token scale (green), a `emerald-*` shade, or the brand navy?

**Decision:** Navy (`text-brand`/`bg-brand/10`), product-wide. The `success` token family in
`@toolforge/design-tokens` stays defined but unused for this purpose. The checkmark icon itself
carries the "this succeeded" meaning — success states must never depend on color alone.

**Why:** The frozen palette (ADR-004) is single-accent navy plus danger-red, with no per-tool or
per-state color proliferation. Introducing green for "success" would reintroduce a second accent
color the platform deliberately avoided, and would sit oddly next to `#fa2d14` being reserved
strictly for danger. Surfaced while extracting the shared tool-page identity in P1 Phase C
(`ResultPanel` in `@toolforge/ui`) — the PDF Merge page's pre-redesign "Ready" badges and success
checkmark used raw Tailwind `emerald-*` classes (not even token-routed), which was both an
accidental holdover from the pre-navy palette and a hard-rule-9 violation independent of it.

**What was rejected:** Using the `success` scale (`colors.success` in design-tokens, still `#16a34a`
green) for these states — rejected for the same single-accent reasoning above, not because the token
itself is wrong to keep around for some future need.

---

**Question (part 2):** Should the minimal one-line tool-page footer be unified with home's full
`HomeFooter` (tool links, proprietary notice, contact email) now that tool pages are being
redesigned to match home's navy identity?

**Decision:** No — keep them distinct. `apps/web/src/components/tool-page-footer.tsx` (shared across
the three tool pages, exact minimal one-line text, navy-token-ized) is intentionally separate from
`apps/web/src/app/_home/home-footer.tsx` (home-only, fuller content).

**Why:** Unifying would be a content decision (adding tool links, legal text, and a contact email to
every tool page), not a visual re-skin — out of scope for a visual/layout redesign checkpoint, and
not something one tool's redesign should decide unilaterally for the other two. This is recorded
explicitly so a later phase doesn't "clean up" the apparent duplication and silently merge them —
it's an intentional distinction, not an unresolved duplicate.

**What was rejected:** Promoting `HomeFooter` to `apps/web/src/components/` and using it everywhere
— rejected for now per the reasoning above; may be revisited as its own deliberate decision later.

---

## ADR-007: QR generation is client-side

Date: 2026-08-06 Status: Decided

**Question:** Should QR codes be generated server-side (via `qr-service`) or client-side (in the
browser)?

**Decision:** Client-side, using the `custom-qr-code` npm library (MIT license), in
`apps/web/src/app/qr-generator/qr-canvas.ts`.

**Why:** Instant generation with no server round-trip, works offline, no server load for QR
generation, no file cleanup needed — a QR code is derived purely from user input, so there's nothing
to store or retain.

**What was rejected:**

- `@qr-platform/qr-code.js` — commercial license, requires a paid plan or attribution badge for
  commercial use. Rejected on licensing grounds.
- Hand-written canvas renderer — attempted, produced broken shapes and clipped finder patterns.
  Replaced with the library.

**Consequence to be aware of:** `services/qr-service` still exists and is a fully working, tested
tool (`qr-generate`, using the `qrcode` npm package) reachable via `api-gateway`. It is not called
by the web app. This wasn't reversed after ADR-007 was made; it's lingering scope, not an oversight
anyone should "clean up" without checking whether qr-service has a planned future use (e.g., a
public API) first.

**Follow-up (2026-08-08):** `services/qr-service` has no `Dockerfile`, but it was still listed in
`.github/workflows/docker.yml`'s build matrix, which would fail that job on the next qualifying
push. Rather than adding a Dockerfile in a docs-correctness pass, `qr-service` was removed from the
matrix — see the comment left at the removal site in `docker.yml`. It needs to be added back once it
has a Dockerfile, and its Docker image + deploy story (does it get its own deploy, or fold into
`pdf-service`?) is still an open question — see `ZIPPLY_CONTEXT.md` Known Issues and
`NEXT_STEPS.md`.

---

## ADR-006: Brand name — Zipply

Date: 2026-08-05 (approx. — first appears in commit `b7d18e0`) Status: Decided

**Question:** What is the public brand name for this product?

**Decision:** Zipply, domain zipply.tools.

**Why:** Two syllables, "zip" carries speed/compression/ease semantics, globally pronounceable,
differentiates from generic blue PDF tool competitors.

**What was rejected:**

- ToolForge — the original internal name, sounds like a developer platform, not a consumer tool.
  Kept as the internal package scope (`@toolforge/*`) and root package name (`toolforge`) — this is
  intentional, not an inconsistency to "fix." Don't rename the npm scope.

**Note:** `README.md`, `LICENSE`, and all `apps/web` user-facing copy use "Zipply." Internal docs
(`PLATFORM_FOUNDATION.md`, `MANUAL.md`, `CONTRIBUTING.md`, `AGENT_PROMPT_PHASE_2.md`) predate the
rename and still say "ToolForge" throughout — that's expected; they describe the platform
architecture, which didn't change name internally.

---

## ADR-005: QR frame rendering approach

Date: 2026-08-06 Status: Decided

**Question:** How should QR shape frames (the decorative borders/banners around a QR code) be
rendered?

**Decision:** Two modes, both implemented in `qr-canvas.ts`:

- **Frame shapes** (circle, rounded, square, shield, hexagon, diamond, brackets, badge, speech
  bubble): draw the full square QR at reduced scale, then add the frame chrome as SVG shapes drawn
  _around_ it, sized proportionally via a `k = qrSize / 280` scale factor.
- **Social card presets**: fixed platform-branded card layout (header band + QR + footer CTA) via
  `buildSocialCard()`, which also recolors the QR's own dots/corners/background to match the
  platform brand (see `PLATFORM_QR_COLORS` in `qr-canvas.ts`) instead of the user's chosen
  foreground/background colors.

**Why:** An early attempt used `ctx.clip()` on the QR's own canvas to carve frame shapes directly
out of the QR — this clipped the finder patterns (the three big corner squares), making the QR
unscannable. The current approach never clips the QR's own drawing; frames are separate SVG chrome
composited around an untouched QR render.

---

## ADR-004: Color system — Emerald replacing Blue

Date: 2026-08-06 (commit `644b971`) Status: Decided, **superseded 2026-08-08 — see below**

**Question:** What should the primary brand color be?

**Decision:** Emerald (`#059669`-family) as the primary brand color, replacing an earlier blue
(`#2f5fe6` — still visible as a leftover default in `qr-client.tsx`'s `DEF.frameColor`, which wasn't
updated when the rest of the site's palette changed).

**Why:** Every major PDF tool competitor (iLovePDF, Smallpdf, Adobe) uses blue. Emerald
differentiates while remaining trustworthy and professional.

**Known follow-up (resolved 2026-08-08 — see Superseded note below):** the QR generator's default
frame color constant used the old blue (`apps/web/src/app/qr-generator/qr-client.tsx:35`,
`frameColor: '#2f5fe6'`). This was a leftover from before the rebrand, not a deliberate exception —
it has now been fixed, but to the new brand primary below, not to emerald.

**Superseded (2026-08-08):** the frozen brand primary is now **Penn Blue `#141E5A`**, with a warm
off-white base (`#F8F5F1`) and `#fa2d14` reserved strictly for danger/delete actions — never a brand
accent. This decision is not re-litigated here; it's recorded as a fact to encode going forward.
Per-tool accent colors are not finalized as of this note — don't invent hex values for them. **This
has not yet been executed in code.** `packages/design-tokens/src/index.ts`'s `brand` scale
(`brand.600 = '#059669'`) and the entire rendered site still use emerald — migrating the actual
design tokens and UI to Penn Blue is P1 scope (see `NEXT_STEPS.md`), not done by this note. The one
exception is `qr-generator/qr-client.tsx`'s `DEF.frameColor`, which was updated directly to
`#141E5A` as a scoped, literal fix (see `AGENT_INSTRUCTIONS.md` hard rule #9) — it is the only place
in the live UI that currently reflects the new primary.

---

## ADR-003: PDF rendering — pdf-lib (pure JS)

Date: Foundation phase (predates this decision log) Status: Decided

**Question:** Which library powers PDF merge and split?

**Decision:** `pdf-lib` (pure JavaScript, no native binaries), `^1.17.1`.

**Why:** No native binary dependencies, works in Node without system packages, sufficient for merge
and split operations. `services/pdf-service/src/tools/pdf-merge/manifest.ts` documents this inline
as "ADR-0001" in its own comment (a numbering that doesn't line up with this log — treat this file
as the current source of truth going forward).

**Production note:** for advanced operations (OCR, form filling, complex compression) a future ADR
should evaluate Ghostscript or qpdf via a container runtime, per `PLATFORM_FOUNDATION.md` §3's
original `pdf-service` boundary justification.

---

## ADR-002: Monorepo tooling — Turborepo + pnpm

Date: Foundation phase (predates this decision log) Status: Decided

**Question:** What build system manages the monorepo?

**Decision:** Turborepo (`^2.2.3`) for task orchestration, pnpm (`9.12.3`, pinned via
`packageManager`

- Corepack) for package management.

**Why:** Turborepo's affected-only builds (`--filter='[origin/main]'`, used throughout
`.github/workflows/ci.yml`) cut CI time as the repo grows. pnpm's strict `node_modules` prevents
phantom dependency issues.

---

## ADR-001: Service architecture — microservices on Fly.io

Date: Foundation phase (predates this decision log) Status: Decided, **not yet executed**

**Question:** How are backend services deployed?

**Decision:** Independent Fastify services, each in its own Docker container, deployed to Fly.io.
Web app on Vercel.

**Why:** Each service can scale independently. Fly.io has a generous free tier and runs Docker
natively. Vercel handles Next.js optimally (edge, ISR, CDN).

**Status as of 2026-08-08:** Docker images build for `api-gateway`, `pdf-service`, and `web`.
`qr-service` was removed from the build matrix (see ADR-007 follow-up) and will need a Dockerfile
before it can be added back. Nothing is actually deployed to Fly.io, Vercel, or any host — this ADR
describes the target, not current reality. See `ZIPPLY_CONTEXT.md` § Deployment status.
