import { defineConfig } from 'vitest/config';

// The app's tsconfig sets `jsx: "preserve"` for Next.js's own compiler to handle. Vitest's esbuild
// transform doesn't understand that mode the same way and falls back to the classic transform,
// which needs `React` in scope — none of these files import it, since Next.js already provides the
// automatic runtime. Configuring the automatic runtime here keeps test output matching what Next
// actually ships.
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
});
