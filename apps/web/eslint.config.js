import nextConfig from '@toolforge/eslint-config/next';

export default [...nextConfig, { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] }];
