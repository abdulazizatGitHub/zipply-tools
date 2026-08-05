import nodeConfig from '@toolforge/eslint-config/node';

export default [...nodeConfig, { ignores: ['dist/**', 'node_modules/**', 'scripts/**'] }];
