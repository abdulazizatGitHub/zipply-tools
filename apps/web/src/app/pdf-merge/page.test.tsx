import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PdfMergePage from './page.js';

describe('PdfMergePage (current, pre-redesign)', () => {
  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<PdfMergePage />)).not.toThrow();
  });

  it('renders the tool heading', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('PDF Merge');
  });

  it('renders the FAQ section', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('How many PDFs can I merge?');
  });

  it('renders the JSON-LD structured data scripts', () => {
    const html = renderToStaticMarkup(<PdfMergePage />);
    expect(html).toContain('application/ld+json');
  });
});
