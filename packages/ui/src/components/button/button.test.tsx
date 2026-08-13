import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from './button.js';

describe('Button', () => {
  it('renders its children', () => {
    const html = renderToStaticMarkup(<Button>Merge PDFs</Button>);
    expect(html).toContain('Merge PDFs');
  });

  it('applies the primary variant by default', () => {
    const html = renderToStaticMarkup(<Button>Go</Button>);
    expect(html).toContain('bg-brand');
  });

  it('respects the variant prop', () => {
    const html = renderToStaticMarkup(<Button variant="danger">Delete</Button>);
    expect(html).toContain('bg-danger');
  });

  it('respects the disabled prop', () => {
    const html = renderToStaticMarkup(<Button disabled>Go</Button>);
    expect(html).toContain('disabled=""');
  });

  it('is not disabled by default', () => {
    const html = renderToStaticMarkup(<Button>Go</Button>);
    expect(html).not.toContain('disabled=""');
  });
});
