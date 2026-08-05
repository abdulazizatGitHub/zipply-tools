/**
 * Conventional commits, ToolForge flavor.
 *
 * Why: commit messages are the input every release tool expects. A clean
 * convention turns into automatic changelogs, semver-correct package
 * publishing, and a debugger-friendly history.
 *
 * The `scope-enum` mirrors the workspace topology — when you touch a
 * package or service, name it. PRs without a scope on a multi-package
 * monorepo become impossible to scan after month three.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-empty': [1, 'never'],
    'scope-enum': [
      1,
      'always',
      [
        // platform packages
        'tool-contract',
        'platform-client',
        'auth-client',
        'billing-client',
        'files-client',
        'ai-client',
        'metering-client',
        'telemetry',
        'env',
        'errors',
        'events',
        'i18n',
        'seo-kit',
        'ui',
        'design-tokens',
        'sdk',
        'test-utils',
        'eslint-config',
        'tsconfig',
        'prettier-config',
        // services
        'api-gateway',
        'identity',
        'billing',
        'metering',
        'files',
        'ai-gateway',
        'seo-engine',
        'notifications',
        'pdf-service',
        'image-service',
        'qr-service',
        'convert-service',
        'dev-utils-service',
        // apps
        'web',
        'admin',
        'docs',
        // tools
        'create-tool',
        'manifest-validator',
        // infra
        'infra',
        'ci',
        'deps',
        'release',
        'repo',
      ],
    ],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 120],
  },
};
