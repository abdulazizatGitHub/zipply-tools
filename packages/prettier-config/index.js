// Shared Prettier config. Inherited by every workspace via root .prettierrc.cjs.
// Keep this minimal — Prettier already has good defaults. Tune only what matters.
/** @type {import('prettier').Config} */
module.exports = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  proseWrap: 'preserve',
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: { trailingComma: 'none' },
    },
    {
      files: ['*.md', '*.mdx'],
      options: { proseWrap: 'always', printWidth: 100 },
    },
    {
      files: ['*.yaml', '*.yml'],
      options: { singleQuote: false },
    },
  ],
};
