import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ToolHeroStrip } from './tool-hero-strip.js';

function DummyIcon({ className }: { className?: string }) {
  return <svg className={className} aria-hidden />;
}

describe('ToolHeroStrip', () => {
  it('renders the title and description', () => {
    const html = renderToStaticMarkup(
      <ToolHeroStrip icon={DummyIcon} title="PDF Merge" description="Combine PDFs." />,
    );
    expect(html).toContain('PDF Merge');
    expect(html).toContain('Combine PDFs.');
  });

  it('renders the Free tag', () => {
    const html = renderToStaticMarkup(
      <ToolHeroStrip icon={DummyIcon} title="PDF Merge" description="Combine PDFs." />,
    );
    expect(html).toContain('Free');
  });

  it('defaults to max-w-5xl and respects a custom maxWidthClassName', () => {
    const defaultHtml = renderToStaticMarkup(
      <ToolHeroStrip icon={DummyIcon} title="PDF Merge" description="Combine PDFs." />,
    );
    expect(defaultHtml).toContain('max-w-5xl');

    const wideHtml = renderToStaticMarkup(
      <ToolHeroStrip
        icon={DummyIcon}
        title="QR Generator"
        description="Make QR codes."
        maxWidthClassName="max-w-6xl"
      />,
    );
    expect(wideHtml).toContain('max-w-6xl');
    expect(wideHtml).not.toContain('max-w-5xl');
  });

  it('uses the navy accent, not a per-tool color', () => {
    const html = renderToStaticMarkup(
      <ToolHeroStrip icon={DummyIcon} title="PDF Merge" description="Combine PDFs." />,
    );
    expect(html).toContain('bg-brand');
  });
});
