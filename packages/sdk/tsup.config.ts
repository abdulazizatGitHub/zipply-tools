import { defineConfig } from 'tsup';

// SDK is the only package we publish; ship dual ESM/CJS for broad consumer
// compatibility, minified, with a clean tree-shakeable surface.
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  target: 'es2020',
});
