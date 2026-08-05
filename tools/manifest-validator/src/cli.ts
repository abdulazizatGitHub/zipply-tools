#!/usr/bin/env node
/**
 * manifest-validator — CI guardrail for the Tool Contract.
 *
 * Walks the repo, finds every `manifest.ts` under `services/<svc>/src/tools/<id>/`,
 * imports it, and asserts:
 *   - The module exports a `manifest` object that passes `parseToolManifest`.
 *     (Manifests already call `parseToolManifest` at module load, so an
 *     invalid manifest throws on import — we surface the error instead of
 *     the raw stack.)
 *   - `manifest.id` and `manifest.slug` are unique across the whole repo.
 *   - The filesystem directory name matches `manifest.id` (so the URL
 *     surface stays predictable).
 *
 * Exit code 0 on success, 1 on any failure. Intended to run in CI before
 * any service is deployed.
 *
 * Run via:
 *   pnpm --filter @toolforge/manifest-validator start
 */

import { readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseToolManifest, type ToolManifest } from '@toolforge/tool-contract';

interface Finding {
  level: 'error' | 'info';
  path: string;
  message: string;
}

const SCAN_ROOTS = ['services', 'apps', 'packages'];

async function findRepoRoot(start: string): Promise<string> {
  let dir = resolve(start);
  for (;;) {
    if (await exists(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

const ROOT = await findRepoRoot(process.cwd());

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursive walk that yields every `manifest.ts` whose parent path matches
 * `…/src/tools/<dir>/manifest.ts`. We do not import every TS file — only
 * the canonical tool-manifest location, so naming discipline is enforced.
 */
async function* findManifestFiles(root: string): AsyncGenerator<string> {
  const entries = await readdir(root, { withFileTypes: true }).catch(
    () => [] as Awaited<ReturnType<typeof readdir>>,
  );
  for (const entry of entries) {
    const name = typeof entry.name === 'string' ? entry.name : entry.name.toString();
    if (name === 'node_modules' || name === 'dist' || name === '.next') continue;
    const full = join(root, name);
    if (entry.isDirectory()) {
      yield* findManifestFiles(full);
    } else if (entry.isFile() && name === 'manifest.ts') {
      // Match `…/src/tools/<id>/manifest.ts`.
      const rel = relative(ROOT, full).split(sep);
      const i = rel.indexOf('tools');
      if (i > 0 && rel[i - 1] === 'src' && i + 2 < rel.length && rel[i + 2] === 'manifest.ts') {
        yield full;
      }
    }
  }
}

async function loadManifest(file: string): Promise<{
  manifest: ToolManifest;
  expectedDirName: string;
}> {
  const mod = (await import(pathToFileURL(file).href)) as {
    manifest?: unknown;
    default?: unknown;
  };
  const raw = mod.manifest ?? mod.default;
  if (!raw) {
    throw new Error(`module does not export a 'manifest' (or default export). File: ${file}`);
  }
  // Re-parse defensively in case the source bypassed parseToolManifest.
  const manifest = parseToolManifest(raw);
  const expectedDirName = dirname(file).split(sep).pop() ?? '';
  return { manifest, expectedDirName };
}

async function main(): Promise<number> {
  const findings: Finding[] = [];
  const idsSeen = new Map<string, string>();
  const slugsSeen = new Map<string, string>();
  let count = 0;

  for (const r of SCAN_ROOTS) {
    const root = resolve(ROOT, r);
    if (!(await exists(root))) continue;
    for await (const file of findManifestFiles(root)) {
      count += 1;
      const rel = relative(ROOT, file);
      try {
        const { manifest, expectedDirName } = await loadManifest(file);

        const prevId = idsSeen.get(manifest.id);
        if (prevId) {
          findings.push({
            level: 'error',
            path: rel,
            message: `duplicate tool id '${manifest.id}' (also declared in ${prevId})`,
          });
        } else {
          idsSeen.set(manifest.id, rel);
        }

        const prevSlug = slugsSeen.get(manifest.slug);
        if (prevSlug) {
          findings.push({
            level: 'error',
            path: rel,
            message: `duplicate slug '${manifest.slug}' (also declared in ${prevSlug})`,
          });
        } else {
          slugsSeen.set(manifest.slug, rel);
        }

        if (expectedDirName !== manifest.id) {
          findings.push({
            level: 'error',
            path: rel,
            message: `directory name '${expectedDirName}' does not match manifest.id '${manifest.id}'`,
          });
        }
      } catch (err) {
        findings.push({
          level: 'error',
          path: rel,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  const errors = findings.filter((f) => f.level === 'error');
  if (errors.length === 0) {
    console.log(`manifest-validator: ${String(count)} manifest(s) OK`);
    return 0;
  }
  console.error(
    `manifest-validator: ${String(errors.length)} error(s) across ${String(count)} manifest(s):`,
  );
  for (const f of errors) {
    console.error(`  ${f.path}: ${f.message}`);
  }
  return 1;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((err: unknown) => {
    console.error('manifest-validator: fatal', err);
    process.exit(2);
  });
