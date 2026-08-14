import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PdfMergePage from './page.js';

describe('PdfMergePage (navy flow redesign)', () => {
  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<PdfMergePage />)).not.toThrow();
  });

  it('renders the tool heading and Free tag', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('PDF Merge');
    expect(html).toContain('Free');
  });

  it('renders the shared sidebar cards', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('How to use');
    expect(html).toContain('Limits');
    expect(html).toContain('PDF Split');
  });

  it('renders the drop zone and step indicator', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('Drop PDF files here');
    expect(html).toContain('Merge');
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
