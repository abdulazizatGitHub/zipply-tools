import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ToolFaqSection } from './tool-faq-section.js';

const ITEMS = [
  { question: 'How many PDFs can I merge?', answer: 'Up to 20 files.' },
  { question: 'Is this free?', answer: 'Yes, completely free.' },
];

describe('ToolFaqSection', () => {
  it('renders every question and answer', () => {
    const html = renderToStaticMarkup(<ToolFaqSection items={ITEMS} />);
    expect(html).toContain('How many PDFs can I merge?');
    expect(html).toContain('Up to 20 files.');
    expect(html).toContain('Is this free?');
    expect(html).toContain('Yes, completely free.');
  });

  it('defaults to a 2-column layout', () => {
    const html = renderToStaticMarkup(<ToolFaqSection items={ITEMS} />);
    expect(html).not.toContain('lg:grid-cols-3');
  });

  it('respects columns=3', () => {
    const html = renderToStaticMarkup(<ToolFaqSection items={ITEMS} columns={3} />);
    expect(html).toContain('lg:grid-cols-3');
  });
});
