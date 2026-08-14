import type { ReactElement } from 'react';

/**
 * Minimal one-line footer shared by the three tool pages. Deliberately distinct from
 * `_home/home-footer.tsx` (full content, home-only) — see DECISIONS.md ADR-008: this is an
 * intentional distinction, not a duplicate to consolidate.
 */
export function ToolPageFooter(): ReactElement {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-0 py-6 text-center text-xs text-neutral-400">
      Zipply — free file tools · no account required
    </footer>
  );
}
