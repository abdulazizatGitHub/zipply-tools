# Zipply

> Copyright (c) 2025 Zipply. All rights reserved. Proprietary and confidential software.

Free online file tools — fast, private, no account required.

## Tools

- **PDF Merge** — Combine multiple PDFs into one file
- **PDF Split** — Split a PDF by page range
- **QR Generator** — Custom QR codes with frames and social templates

## Branch Strategy

| Branch    | Purpose     | Docker Built | Deployed     |
| --------- | ----------- | ------------ | ------------ |
| `dev`     | Development | No           | No           |
| `preprod` | Staging     | Yes          | Preprod env  |
| `main`    | Production  | Yes          | zipply.tools |

**Active development happens on `dev`.** PRs go: `dev` → `preprod` → `main`

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for local infrastructure only)

### Setup

```bash
git clone https://github.com/abdulazizatGitHub/zipply-tools.git
cd zipply-tools
git checkout dev
pnpm install
```

### Start local infrastructure

```bash
docker-compose -f infra/docker-compose.yml up -d
```

### Start all services (PowerShell)

```powershell
pnpm --filter @toolforge/web --filter @toolforge/api-gateway --filter @toolforge/pdf-service --filter @toolforge/qr-service dev
```

### Start all services (bash/zsh)

```bash
pnpm --filter @toolforge/web \
     --filter @toolforge/api-gateway \
     --filter @toolforge/pdf-service \
     --filter @toolforge/qr-service \
     dev
```

### Service ports

| Service     | Port |
| ----------- | ---- |
| Web         | 3000 |
| API Gateway | 8080 |
| PDF Service | 8081 |
| QR Service  | 8082 |

### Run CI checks

```bash
pnpm validate
```

## Docker Images

Built on push to `preprod` and `main`. Published to `ghcr.io/abdulazizatgithub/zipply-{service}`.

## License

Copyright (c) 2025 Zipply. All rights reserved. Proprietary and confidential. For licensing:
abdulwork058@gmail.com
