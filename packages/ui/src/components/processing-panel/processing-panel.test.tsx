import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ProcessingPanel } from './processing-panel.js';

describe('ProcessingPanel', () => {
  it('renders the label', () => {
    const html = renderToStaticMarkup(<ProcessingPanel label="Merging your PDFs…" />);
    expect(html).toContain('Merging your PDFs…');
  });

  it('announces itself as a live status region', () => {
    const html = renderToStaticMarkup(<ProcessingPanel label="Working…" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it('uses the navy accent for the spinner', () => {
    const html = renderToStaticMarkup(<ProcessingPanel label="Working…" />);
    expect(html).toContain('border-t-brand');
  });
});
