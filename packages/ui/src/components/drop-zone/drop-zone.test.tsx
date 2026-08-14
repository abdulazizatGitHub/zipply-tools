import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { DropZone } from './drop-zone.js';

describe('DropZone', () => {
  it('renders its default label', () => {
    const html = renderToStaticMarkup(<DropZone />);
    expect(html).toContain('Drop files here');
  });

  it('renders a custom label and hint', () => {
    const html = renderToStaticMarkup(<DropZone label="Drop PDFs" hint="Up to 20 files" />);
    expect(html).toContain('Drop PDFs');
    expect(html).toContain('Up to 20 files');
  });

  it('respects the disabled prop', () => {
    const html = renderToStaticMarkup(<DropZone disabled />);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('border-neutral-200');
  });

  it('respects the controlled active prop', () => {
    const html = renderToStaticMarkup(<DropZone active />);
    expect(html).toContain('data-state="active"');
    expect(html).toContain('border-brand');
  });

  it('defaults to the idle state', () => {
    const html = renderToStaticMarkup(<DropZone />);
    expect(html).toContain('data-state="idle"');
  });

  it('gains button semantics only when onClick is provided', () => {
    const withoutClick = renderToStaticMarkup(<DropZone />);
    expect(withoutClick).not.toContain('role="button"');

    const withClick = renderToStaticMarkup(<DropZone onClick={vi.fn()} />);
    expect(withClick).toContain('role="button"');
    expect(withClick).toContain('tabindex="0"');
  });

  it('does not expose button semantics when disabled, even with onClick', () => {
    const html = renderToStaticMarkup(<DropZone onClick={vi.fn()} disabled />);
    expect(html).not.toContain('tabindex="0"');
  });

  it('renders custom children instead of the default label/hint', () => {
    const html = renderToStaticMarkup(
      <DropZone label="Should not appear">
        <span>Custom content</span>
      </DropZone>,
    );
    expect(html).toContain('Custom content');
    expect(html).not.toContain('Should not appear');
  });
});
