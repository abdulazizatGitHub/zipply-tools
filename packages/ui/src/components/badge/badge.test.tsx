import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge.js';

describe('Badge', () => {
  it('renders its children', () => {
    const html = renderToStaticMarkup(<Badge>New</Badge>);
    expect(html).toContain('New');
  });

  it('applies the neutral variant by default', () => {
    const html = renderToStaticMarkup(<Badge>New</Badge>);
    expect(html).toContain('bg-neutral-100');
  });

  it('respects the variant prop', () => {
    const html = renderToStaticMarkup(<Badge variant="danger">Expired</Badge>);
    expect(html).toContain('bg-danger/10');
  });
});
