import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from './page.js';

describe('HomePage (P1 Phase B redesign)', () => {
  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<HomePage />)).not.toThrow();
  });

  it('renders the site wordmark', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('Zipply');
  });

  it('renders the hero headline', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('don&#x27;t get in your way');
  });

  it('links to all three live tools', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('href="/pdf-merge"');
    expect(html).toContain('href="/pdf-split"');
    expect(html).toContain('href="/qr-generator"');
  });

  it('has no sign-up or login controls', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html.toLowerCase()).not.toContain('sign up');
    expect(html.toLowerCase()).not.toContain('sign-up');
    expect(html.toLowerCase()).not.toContain('log in');
    expect(html.toLowerCase()).not.toContain('login');
  });

  it('renders the how-it-works steps', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('Upload');
    expect(html).toContain('Process');
    expect(html).toContain('Download');
  });

  it('renders the honest comparison section without naming a competitor', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('Typical free PDF sites');
    expect(html.toLowerCase()).not.toContain('ilovepdf');
    expect(html.toLowerCase()).not.toContain('smallpdf');
  });

  it('renders the footer with the licensing contact', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('abdulwork058@gmail.com');
  });
});
