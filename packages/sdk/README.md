# @toolforge/sdk

Official TypeScript SDK for the ToolForge platform.

```bash
npm install @toolforge/sdk
```

```ts
import { ToolForgeClient } from '@toolforge/sdk';

const tf = new ToolForgeClient({ apiKey: process.env.TOOLFORGE_API_KEY });

// API surface lands in Phase 2.
```

Public, semver-bound. Internal clients (`@toolforge/auth-client` etc.) are private and ship a
different shape — do not use them outside the monorepo.
