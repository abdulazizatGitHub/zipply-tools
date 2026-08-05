import nodeConfig from '@toolforge/eslint-config/node';

export default [
  ...nodeConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    // This package legitimately bootstraps process.env + console for telemetry init.
    rules: {
      'no-restricted-properties': 'off',
      'no-console': 'off',
    },
  },
];
