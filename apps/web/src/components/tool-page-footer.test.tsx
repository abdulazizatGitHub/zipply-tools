import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ToolPageFooter } from './tool-page-footer.js';

describe('ToolPageFooter', () => {
  it('renders the minimal footer line', () => {
    const html = renderToStaticMarkup(<ToolPageFooter />);
    expect(html).toContain('Zipply — free file tools · no account required');
  });
});
