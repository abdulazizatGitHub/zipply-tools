import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import QrGeneratorPage from './page.js';

describe('QrGeneratorPage (current, pre-redesign)', () => {
  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<QrGeneratorPage />)).not.toThrow();
  });

  it('renders the tool heading', () => {
    const html = renderToStaticMarkup(<QrGeneratorPage />);
    expect(html).toContain('QR Generator');
  });

  it('renders the FAQ section', () => {
    const html = renderToStaticMarkup(<QrGeneratorPage />);
    expect(html).toContain('What can a QR code encode?');
  });

  it('renders the JSON-LD structured data scripts', () => {
    const html = renderToStaticMarkup(<QrGeneratorPage />);
    expect(html).toContain('application/ld+json');
  });
});
