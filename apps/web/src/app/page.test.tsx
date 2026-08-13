import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from './page.js';

describe('HomePage (current, pre-redesign)', () => {
  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<HomePage />)).not.toThrow();
  });

  it('renders the site nav wordmark', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('Zipply');
  });

  it('renders the hero headline', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('just work');
  });

  it('renders a card for every live tool', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('PDF Merge');
    expect(html).toContain('PDF Split');
    expect(html).toContain('QR Generator');
  });

  it('renders the footer', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('Free · No sign-up');
  });
});
