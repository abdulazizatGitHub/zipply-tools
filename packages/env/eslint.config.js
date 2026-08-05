import nodeConfig from '@toolforge/eslint-config/node';

export default [
  ...nodeConfig,
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    // @toolforge/env IS the env validator — process.env reads are legitimate here.
    rules: {
      'no-restricted-properties': 'off',
    },
  },
];
