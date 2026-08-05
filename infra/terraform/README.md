# infra/terraform/

Cloud resource IaC. **Status: Phase 2 placeholder.**

When this fills in:

- `cloudflare/` — DNS, R2 buckets, Workers, WAF, rate-limit rules
- `fly/` — service deploys, machine sizing, regions, secrets binding
- `database/` — managed Postgres (Neon → RDS), Redis (Upstash → ElastiCache)
- `observability/` — Grafana Cloud or Datadog backend wiring
- `secrets/` — Doppler / Infisical workspace structure

## Hard rules (effective day one)

1. **No production resource is created outside Terraform.** Console clicks against prod require an
   exception form filed before the click.
2. **Terraform state is remote and locked.** S3+DynamoDB, GCS+state lock, or Terraform Cloud. Never
   local state for shared environments.
3. **Modules over copy-paste.** A second copy of any block is a refactor debt; a third copy is a P0.
4. **One PR per environment for any risky change.** Apply to staging, prove it, then promote.
