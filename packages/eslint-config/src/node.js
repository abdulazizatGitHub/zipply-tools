// Node service ESLint config.
// Adds: Node globals, restrictions to keep services well-behaved.

import globals from 'globals';

import { baseConfig } from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export const nodeConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Services use structured logging — no console.
      'no-console': 'error',

      // No direct env access — must go through @toolforge/env.
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'Do not read process.env directly. Use the validated schema from @toolforge/env.',
        },
      ],

      // No raw vendor SDK calls — must go through client packages.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'openai',
              message: 'Use @toolforge/ai-client → ai-gateway service.',
            },
            {
              name: '@anthropic-ai/sdk',
              message: 'Use @toolforge/ai-client → ai-gateway service.',
            },
            {
              name: 'stripe',
              message: 'Use @toolforge/billing-client → billing service.',
            },
            {
              name: '@aws-sdk/client-s3',
              message: 'Use @toolforge/files-client → files service.',
            },
          ],
          patterns: [
            {
              group: ['**/dist/*', '**/dist'],
              message: 'Import from package entry, not from dist.',
            },
          ],
        },
      ],
    },
  },
  {
    // Exceptions for the *client* and *service* packages that legitimately
    // wrap the underlying SDKs.
    files: [
      'packages/ai-client/**',
      'packages/billing-client/**',
      'packages/files-client/**',
      'services/ai-gateway/**',
      'services/billing/**',
      'services/files/**',
      'services/identity/**',
      'packages/env/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-properties': 'off',
    },
  },
];

export default nodeConfig;
