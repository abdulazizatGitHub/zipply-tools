import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PdfSplitPage from './page.js';

describe('PdfSplitPage (current, pre-redesign)', () => {
  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<PdfSplitPage />)).not.toThrow();
  });

  it('renders the tool heading', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).toContain('PDF Split');
  });

  it('renders the FAQ section', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).toContain('How do I split a PDF into specific pages?');
  });

  it('renders the JSON-LD structured data scripts', () => {
    const html = renderToStaticMarkup(<PdfSplitPage />);
    expect(html).toContain('application/ld+json');
  });
});
