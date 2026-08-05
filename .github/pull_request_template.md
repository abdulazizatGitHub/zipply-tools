<!--
ToolForge PR template. Reviewers expect each section filled in proportion
to the change's blast radius. A one-line fix needs one line per section; a
contract change needs paragraphs.
-->

## What

<!-- The user-visible / system-visible change in one sentence. -->

## Why

<!-- The problem being solved. Link to issue, ADR, or context doc. -->

## Blast radius

<!-- Which packages, services, or users could this break? Which feature flag
guards it? What's the rollback? -->

## Checklist

- [ ] Tests added or updated (or N/A with reason)
- [ ] Telemetry: logs/metrics/traces touched if behavior changed
- [ ] Docs updated if the change is consumer-visible
- [ ] No new vendor SDK imports outside the appropriate boundary service
- [ ] No new direct DB / R2 / S3 access outside the owning service
- [ ] No new direct OpenAI/Anthropic SDK use outside `ai-gateway`
- [ ] Migration plan documented if this is a breaking change

## Screenshots / demo (UI changes only)

<!-- before / after or a short loom. -->
