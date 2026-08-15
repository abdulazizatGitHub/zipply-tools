import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PdfSplitPage from './page.js';

describe('PdfSplitPage (navy redesign, two-panel populated state)', () => {
  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<PdfSplitPage />)).not.toThrow();
  });

  it('renders the tool heading', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).toContain('PDF Split');
  });

  it('does not render the old sidebar cards — dropped in favor of the two-panel populated state', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).not.toContain('How to use');
    expect(html).not.toContain('Limits');
  });

  it('renders the drop zone, step indicator, and the essential-info line', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).toContain('Drop a PDF here');
    expect(html).toContain('Upload');
    expect(html).toContain('Up to 1 file · 50 MB · PDF only · Free · deleted in 1 hour');
  });

  it('renders the FAQ section', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).toContain('How do I split a PDF into specific pages?');
  });

  it('renders the JSON-LD structured data scripts', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).toContain('application/ld+json');
  });

  it('uses the navy accent, never green/emerald/violet, and no numbered brand-* shades', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).toContain('bg-brand');
    expect(html.toLowerCase()).not.toContain('emerald');
    expect(html.toLowerCase()).not.toContain('violet');
    expect(html).not.toMatch(/brand-(50|100|200|300|400|500|600|700|800|900)\b/);
  });
});
