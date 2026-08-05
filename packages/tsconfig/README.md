# @toolforge/tsconfig

Shared TypeScript presets. Every workspace package extends one of these.

| Preset               | Use for                                             |
| -------------------- | --------------------------------------------------- |
| `base.json`          | Pure TS libraries with no DOM/Node bias. Rare.      |
| `node-service.json`  | Backend services and Node CLI tools. Emits `dist/`. |
| `react-library.json` | UI component libraries consumed by Next.js apps.    |
| `nextjs.json`        | Next.js apps. `noEmit: true` (Next handles output). |

## Usage

```jsonc
// packages/<name>/tsconfig.json
{
  "extends": "@toolforge/tsconfig/node-service.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
  },
  "include": ["src/**/*.ts"],
}
```

## Standards encoded here

- `strict: true` and `noUncheckedIndexedAccess: true` are non-negotiable.
- `isolatedModules: true` because every build tool requires it.
- `useUnknownInCatchVariables: true` to force explicit error narrowing.
- `composite: true` on emitting packages enables incremental cross-package builds.

Changes to these presets affect every workspace. Open an ADR first.
