import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PdfMergePage from './page.js';

describe('PdfMergePage (simplified single-column redesign)', () => {
  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<PdfMergePage />)).not.toThrow();
  });

  it('renders the tool heading', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('PDF Merge');
  });

  it('does not render the sidebar cards — single-column, no distraction', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).not.toContain('How to use');
    expect(html).not.toContain('Limits');
  });

  it('renders the drop zone, step indicator, and the essential-info line', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('Drop PDF files here');
    expect(html).toContain('Merge');
    expect(html).toContain(
      'Up to 20 files · 50 MB total · PDF only · Free · deleted within the hour',
    );
  });

  it('renders the FAQ section', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('How many PDFs can I merge?');
  });

  it('renders the JSON-LD structured data scripts', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('application/ld+json');
  });

  it('uses the navy accent, never green/emerald', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('bg-brand');
    expect(html.toLowerCase()).not.toContain('emerald');
    expect(html).not.toMatch(/brand-(50|100|200|300|400|500|600|700|800|900)\b/);
  });
});
