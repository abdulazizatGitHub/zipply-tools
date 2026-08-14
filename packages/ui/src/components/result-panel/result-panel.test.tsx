import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ResultPanel } from './result-panel.js';

describe('ResultPanel', () => {
  it('renders the heading', () => {
    const html = renderToStaticMarkup(<ResultPanel heading="Merge complete!" />);
    expect(html).toContain('Merge complete!');
  });

  it('renders optional subtext', () => {
    const html = renderToStaticMarkup(
      <ResultPanel heading="Merge complete!" subtext="3 pages · 1.2 MB" />,
    );
    expect(html).toContain('3 pages · 1.2 MB');
  });

  it('omits subtext when not provided', () => {
    const html = renderToStaticMarkup(<ResultPanel heading="Merge complete!" />);
    expect(html).not.toContain('<p class="mt-1.5');
  });

  it('renders children in the action slot', () => {
    const html = renderToStaticMarkup(
      <ResultPanel heading="Merge complete!">
        <button type="button">Download</button>
      </ResultPanel>,
    );
    expect(html).toContain('Download');
  });

  it('uses the navy accent, not green, for the success badge', () => {
    const html = renderToStaticMarkup(<ResultPanel heading="Done" />);
    expect(html).toContain('bg-brand/10');
    expect(html).toContain('text-brand');
    expect(html).not.toContain('emerald');
  });
});
