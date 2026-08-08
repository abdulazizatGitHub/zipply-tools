# Zipply — Documentation Index

This folder contains the living context documents for the Zipply project. Read them in this order
when starting a new session:

## 1. [ZIPPLY_CONTEXT.md](./ZIPPLY_CONTEXT.md) — Start here

The master context document. Covers what Zipply is, the full tech stack, what is built and working,
what is stubbed, the architecture, development setup, and current deployment status.

## 2. [PROGRESS.md](./PROGRESS.md) — What is done and what is next

Phase-by-phase progress tracker. Shows what is complete, what is in progress, and what has not been
started. Read this to understand where the project stands.

## 3. [NEXT_STEPS.md](./NEXT_STEPS.md) — What to work on right now

Prioritized action list. Read this to know exactly what the next task is. Updated after every major
work session.

## 4. [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) — How to work on this project

Operating instructions for AI agents. Covers the 10 hard rules, how to add tools, how the PDF and QR
flows work, what requires human action, and the commit/push process.

## 5. [DECISIONS.md](./DECISIONS.md) — Why things are the way they are

Architectural Decision Record log. Read this before proposing any change to the stack, tools, or
architecture. Contains all major decisions with rationale and what was rejected.

---

**NEXT_STEPS.md is the single source of truth for priority order. DECISIONS.md is the single source
of truth for architectural decisions.** No other document in this folder should restate a priority
ordering or a decision's rationale — if you find one that does, it's drift; point it back here
instead of duplicating it.

## Quick orientation (30 seconds)

- **Product:** Zipply — free online file tools (PDF Merge, PDF Split, QR Generator)
- **Domain:** zipply.tools
- **Active branch:** `dev`
- **CI status:** Passing
- **Three working tools:** PDF Merge, PDF Split, QR Generator (all client-verified)
- **Deployment:** Not yet in production — dev/preprod only
- **Next priority:** see [NEXT_STEPS.md](./NEXT_STEPS.md)

## If CI is broken when you start

Run this before anything else:

```bash
git checkout dev
pnpm validate
```

If it fails, fix it before writing any new code.
