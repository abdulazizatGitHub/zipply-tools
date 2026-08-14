import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { KeyValueCard, NumberedStepsCard, RelatedToolCard } from './tool-sidebar.js';

function DummyIcon({ className }: { className?: string }) {
  return <svg className={className} aria-hidden />;
}

describe('NumberedStepsCard', () => {
  it('renders every step, numbered', () => {
    const html = renderToStaticMarkup(
      <NumberedStepsCard steps={['Drop your file', 'Set the order', 'Download']} />,
    );
    expect(html).toContain('Drop your file');
    expect(html).toContain('Set the order');
    expect(html).toContain('Download');
  });

  it('defaults its title to "How to use"', () => {
    const html = renderToStaticMarkup(<NumberedStepsCard steps={['Step one']} />);
    expect(html).toContain('How to use');
  });

  it('respects a custom title', () => {
    const html = renderToStaticMarkup(
      <NumberedStepsCard title="Range format" steps={['1-3 = pages 1 to 3']} />,
    );
    expect(html).toContain('Range format');
  });
});

describe('KeyValueCard', () => {
  it('renders every label/value pair', () => {
    const html = renderToStaticMarkup(
      <KeyValueCard
        items={[
          ['Max files', '20 PDFs'],
          ['Retention', '1 hour'],
        ]}
      />,
    );
    expect(html).toContain('Max files');
    expect(html).toContain('20 PDFs');
    expect(html).toContain('Retention');
    expect(html).toContain('1 hour');
  });

  it('defaults its title to "Limits"', () => {
    const html = renderToStaticMarkup(<KeyValueCard items={[['Cost', 'Free']]} />);
    expect(html).toContain('Limits');
  });
});

describe('RelatedToolCard', () => {
  it('links to the given href and renders name/tagline', () => {
    const html = renderToStaticMarkup(
      <RelatedToolCard
        href="/pdf-split"
        icon={DummyIcon}
        name="PDF Split"
        tagline="Extract or separate pages"
      />,
    );
    expect(html).toContain('href="/pdf-split"');
    expect(html).toContain('PDF Split');
    expect(html).toContain('Extract or separate pages');
  });

  it('uses the navy accent, not a per-tool color', () => {
    const html = renderToStaticMarkup(
      <RelatedToolCard
        href="/pdf-merge"
        icon={DummyIcon}
        name="PDF Merge"
        tagline="Combine PDFs"
      />,
    );
    expect(html).toContain('bg-brand/10');
    expect(html).toContain('text-brand');
  });
});
