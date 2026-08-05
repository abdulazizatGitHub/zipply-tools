/**
 * `create-tool` — scaffold a new tool conforming to @toolforge/tool-contract.
 *
 * Usage:
 *   pnpm scaffold:tool                          # interactive
 *   pnpm scaffold:tool pdf-merge --service pdf-service --runtime node
 *
 * Generates inside the chosen service:
 *   src/tools/<id>/manifest.ts   — contract-validated manifest
 *   src/tools/<id>/handler.ts    — typed handler stub
 *   src/tools/<id>/handler.test.ts
 *   src/tools/<id>/index.ts      — barrel + registry entry
 *
 * The scaffold runs the manifest through Zod parsing before writing — a tool
 * that doesn't pass the contract is never written to disk.
 */

import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { argv, cwd, exit } from 'node:process';

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Argument parsing (no third-party CLI lib — keep dependencies thin)
// ---------------------------------------------------------------------------

interface Args {
  toolId?: string;
  service?: string;
  runtime?: 'node' | 'edge' | 'python' | 'container';
  category?: string;
  force?: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;
    if (arg.startsWith('--')) {
      const [flag, valueInline] = arg.slice(2).split('=');
      const value = valueInline ?? argv[++i];
      switch (flag) {
        case 'service':
          args.service = value;
          break;
        case 'runtime':
          if (value === 'node' || value === 'edge' || value === 'python' || value === 'container') {
            args.runtime = value;
          }
          break;
        case 'category':
          args.category = value;
          break;
        case 'force':
          args.force = true;
          break;
      }
    } else {
      args.toolId ??= arg;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ToolIdSchema = z
  .string()
  .min(2)
  .max(48)
  .regex(/^[a-z][a-z0-9-]*[a-z0-9]$/, 'lowercase, hyphens, no trailing hyphen');

const ServiceSchema = z.enum([
  'pdf-service',
  'image-service',
  'qr-service',
  'convert-service',
  'dev-utils-service',
]);

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function manifestTemplate(args: {
  toolId: string;
  category: string;
  runtime: NonNullable<Args['runtime']>;
}): string {
  return `import { parseToolManifest, type ToolManifest } from '@toolforge/tool-contract';

/**
 * Manifest for the ${args.toolId} tool. Parsed (and therefore validated)
 * at module load — a malformed manifest fails the build.
 *
 * Update inputs/outputs/seo/i18n to reflect what this tool actually does
 * before shipping. The defaults below pass the contract but say nothing
 * useful about the tool.
 */
export const manifest: ToolManifest = parseToolManifest({
  id: '${args.toolId}',
  slug: '${args.toolId}',
  version: '0.1.0',
  category: '${args.category}',
  display: {
    name: '${args.toolId}',
    tagline: 'TODO: one-line description of what this tool does.',
    description: 'TODO: full description for landing pages.',
  },
  inputs: [
    // TODO: declare inputs. Example:
    // { name: 'file', kind: 'file', required: true, acceptMimeTypes: ['application/pdf'] },
  ],
  outputs: [
    // TODO: declare outputs. Example:
    // { name: 'result', kind: 'file', mimeType: 'application/pdf' },
  ],
  processing: {
    mode: 'sync',
    durationClass: 'lt-1s',
    runtime: '${args.runtime}',
  },
  pricing: { tier: 'free' },
  seo: {
    titlePattern: '${args.toolId} — ToolForge',
    descriptionPattern: 'TODO: one-line search snippet (~155 chars).',
    keywords: [],
  },
  i18n: {
    defaultLocale: 'en',
    supportedLocales: ['en'],
  },
  dependencies: {
    platformServices: ['files', 'metering'],
    externalServices: [],
  },
  policies: {
    maxInputBytes: 25 * 1024 * 1024,
    maxOutputBytes: 25 * 1024 * 1024,
    retentionSeconds: 24 * 60 * 60,
    syncTimeoutMs: 30_000,
  },
});
`;
}

function handlerTemplate(args: { toolId: string }): string {
  return `import { defineTool } from '@toolforge/tool-contract';
import { z } from 'zod';

import { manifest } from './manifest.js';

/**
 * ${args.toolId} — handler implementation.
 *
 * \`defineTool\` ties manifest + input/output schemas + execute function
 * together with full type inference. The registry imports the default
 * export of this module to load the tool.
 */
const inputSchema = z.object({
  // TODO: match the manifest \`inputs\` declaration.
});

const outputSchema = z.object({
  // TODO: match the manifest \`outputs\` declaration.
});

export default defineTool({
  manifest,
  input: inputSchema,
  output: outputSchema,
  async execute(_input, ctx) {
    ctx.logger.info({ toolId: manifest.id }, 'invoked');

    // TODO: implement the tool. Use ctx.files for I/O, ctx.metering.record
    // for usage, ctx.ai for model calls. Never import vendor SDKs directly.

    throw new Error('${args.toolId}: not yet implemented');
  },
});
`;
}

function testTemplate(args: { toolId: string }): string {
  return `import { describe, expect, it } from 'vitest';

import { manifest } from './manifest.js';

describe('${args.toolId} manifest', () => {
  it('has the expected id', () => {
    expect(manifest.id).toBe('${args.toolId}');
  });

  it('declares its category', () => {
    expect(manifest.category).toBeTruthy();
  });

  // TODO: add handler tests using @toolforge/test-utils fixtures.
});
`;
}

function indexTemplate(): string {
  return `export { manifest } from './manifest.js';
export { default as tool } from './handler.js';
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeFileSafe(path: string, contents: string, force: boolean): Promise<void> {
  if (!force && (await exists(path))) {
    throw new Error(`Refusing to overwrite existing file: ${path}. Use --force.`);
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf8');
}

async function main(): Promise<void> {
  const args = parseArgs(argv.slice(2));

  if (!args.toolId || !args.service || !args.runtime) {
    process.stderr.write(
      'Usage: pnpm scaffold:tool <tool-id> --service <service> --runtime <node|edge|python|container> [--category <name>]\n',
    );
    exit(1);
  }

  const toolId = ToolIdSchema.parse(args.toolId);
  const service = ServiceSchema.parse(args.service);
  const runtime = args.runtime;
  const category = args.category ?? service.replace('-service', '');

  const serviceRoot = resolve(cwd(), 'services', service);
  if (!(await exists(serviceRoot))) {
    process.stderr.write(`Service path not found: ${serviceRoot}\n`);
    exit(2);
  }

  const toolRoot = join(serviceRoot, 'src', 'tools', toolId);
  const files: [string, string][] = [
    [join(toolRoot, 'manifest.ts'), manifestTemplate({ toolId, category, runtime })],
    [join(toolRoot, 'handler.ts'), handlerTemplate({ toolId })],
    [join(toolRoot, 'handler.test.ts'), testTemplate({ toolId })],
    [join(toolRoot, 'index.ts'), indexTemplate()],
  ];

  for (const [path, contents] of files) {
    await writeFileSafe(path, contents, args.force ?? false);
    process.stdout.write(`  created  ${path}\n`);
  }

  process.stdout.write(
    `\nDone. Next:\n` +
      `  1. fill in inputs/outputs in manifest.ts\n` +
      `  2. implement the handler\n` +
      `  3. add tests\n` +
      `  4. register the tool in the service's registry (Phase 2 wiring)\n`,
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`create-tool failed: ${message}\n`);
  exit(1);
});
