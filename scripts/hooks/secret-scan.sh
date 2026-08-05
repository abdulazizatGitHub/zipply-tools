#!/usr/bin/env bash
# Cheap regex-based heuristic run against staged files by the pre-commit
# hook. Real secret scanning lives in CI (gitleaks step in Phase 2).
#
# Kept as a standalone script rather than an inline lefthook `run:` string
# because the regex patterns below contain literal `{...}` interval
# expressions, which collide with lefthook's own `{staged_files}`-style
# template placeholder syntax when inlined directly into lefthook.yml.
set -euo pipefail

if [ "$#" -eq 0 ]; then
  exit 0
fi

if grep -E -lI \
  -e 'sk_live_[A-Za-z0-9]{20,}' \
  -e 'AKIA[0-9A-Z]{16}' \
  -e 'AIza[0-9A-Za-z_-]{35}' \
  "$@" 2>/dev/null; then
  echo "::error::Possible secret in staged files. Move it to Doppler/Infisical."
  exit 1
fi

exit 0
