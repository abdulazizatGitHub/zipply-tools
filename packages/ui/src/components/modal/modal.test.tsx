import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './modal.js';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <Modal open={false} onClose={vi.fn()}>
        Body
      </Modal>,
    );
    expect(html).toBe('');
  });

  it('respects the open prop and renders its content', () => {
    const html = renderToStaticMarkup(
      <Modal open onClose={vi.fn()} title="Delete file?">
        Body
      </Modal>,
    );
    expect(html).toContain('Delete file?');
    expect(html).toContain('Body');
    expect(html).toContain('role="dialog"');
  });
});
