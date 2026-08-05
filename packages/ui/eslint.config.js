import reactConfig from '@toolforge/eslint-config/react';

export default [...reactConfig, { ignores: ['dist/**', 'node_modules/**'] }];
