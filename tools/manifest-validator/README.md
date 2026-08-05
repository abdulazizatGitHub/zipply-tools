# @toolforge/manifest-validator

CI guardrail that walks the repo, finds every tool manifest, and validates it against
`@toolforge/tool-contract`.

**Status:** Foundation-phase placeholder. Phase 2 implements the validator and wires it into the CI
matrix.

**Why it matters:** the Tool Contract is only meaningful if it's enforced. A manual review process
won't survive tool #20. This validator is the self-defense layer of the contract.
