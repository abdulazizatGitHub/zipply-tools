import nodeConfig from '@toolforge/eslint-config/node';

export default [
  ...nodeConfig,
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    // CLI tool — console output is the user interface, not a code smell.
    rules: {
      'no-console': 'off',
    },
  },
];
