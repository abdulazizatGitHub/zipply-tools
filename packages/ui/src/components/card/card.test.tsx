import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Card } from './card.js';

describe('Card', () => {
  it('renders its children', () => {
    const html = renderToStaticMarkup(<Card>Tool summary</Card>);
    expect(html).toContain('Tool summary');
  });

  it('merges a custom className with its defaults', () => {
    const html = renderToStaticMarkup(<Card className="mt-4">Content</Card>);
    expect(html).toContain('mt-4');
    expect(html).toContain('rounded-2xl');
  });
});
