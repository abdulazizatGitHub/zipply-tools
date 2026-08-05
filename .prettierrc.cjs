// Root prettier config delegates to the shared package.
// Workspaces inherit this automatically; per-package overrides go in their own
// `.prettierrc.cjs` (rare — discourage).
module.exports = require('@toolforge/prettier-config');
