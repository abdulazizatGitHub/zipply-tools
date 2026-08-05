# @toolforge/create-tool

Scaffold a new tool conforming to `@toolforge/tool-contract`.

```bash
# Interactive (Phase 2 will add prompts)
pnpm scaffold:tool

# Direct
pnpm scaffold:tool pdf-merge --service pdf-service --runtime node
pnpm scaffold:tool png-to-webp --service image-service --runtime node --category image
```

Produces, inside the chosen service:

```
src/tools/<id>/
  manifest.ts
  handler.ts
  handler.test.ts
  index.ts
```

Every file is contract-aware. The manifest is validated against `@toolforge/tool-contract` before
being written — a tool that doesn't pass the contract is never on disk.

**Drift safety:** the templates here MUST stay in sync with the contract. Phase 2 adds a CI check
that runs `create-tool` against a sample id and validates the output. If you break the contract, the
scaffold breaks visibly in CI before any tool is harmed.
