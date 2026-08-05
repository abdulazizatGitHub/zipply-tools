// Base ESLint flat config — pure TypeScript.
// Composes: ESLint recommended + typescript-eslint strict + import hygiene +
// unused-imports cleanup + Prettier compatibility (disables stylistic rules).
//
// Other configs (node, react, next) extend this.

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import-x';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = [
  // Build config files and other non-source TS/JS files are not part of the
  // TypeScript project; exclude them from typed-linting (they would error
  // otherwise with "not found by the project service").
  {
    ignores: [
      '**/eslint.config.{js,cjs,mjs}',
      '**/tsup.config.{js,ts,mjs,cjs}',
      '**/vitest.config.{js,ts,mjs,cjs}',
      '**/tailwind.config.{js,ts,mjs,cjs}',
      '**/postcss.config.{js,ts,mjs,cjs}',
      '**/next.config.{js,ts,mjs,cjs}',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.es2023,
      },
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      'import-x': importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // Force narrowing of caught errors.
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',

      // No floating promises in services or libs — bugs we never want.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // `any` is allowed only with explicit justification.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Imports
      'import-x/no-cycle': ['error', { maxDepth: 5 }],
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/order': [
        'warn',
        {
          groups: ['builtin', 'external', ['internal', 'parent', 'sibling', 'index'], 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // Dead code is hidden risk.
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Console is for CLIs only; services must use the telemetry logger.
      // Per-config overrides relax this for tools/.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Prefer top-level await and modern patterns.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use `as const` objects or union types instead of TS enums.',
        },
      ],
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-console': 'off',
    },
  },
  prettier, // MUST be last — disables stylistic rules that conflict with Prettier.
];

export default baseConfig;
