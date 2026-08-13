import { describe, expect, it } from 'vitest';

import { colors } from './index.js';
import { tailwindTokens } from './tailwind.js';

describe('semantic tokens (ADR-004)', () => {
  it('resolves the frozen brand primary', () => {
    expect(colors.brand.DEFAULT).toBe('#141E5A');
  });

  it('resolves the frozen danger accent', () => {
    expect(colors.danger.DEFAULT).toBe('#fa2d14');
  });

  it('resolves the frozen base/background', () => {
    expect(colors.base.DEFAULT).toBe('#F8F5F1');
  });

  it('leaves the existing brand/danger shade scales untouched', () => {
    expect(colors.brand[600]).toBe('#059669');
    expect(colors.danger[500]).toBe('#dc2626');
  });

  it('exposes base to Tailwind via backgroundColor only, not the shared colors map', () => {
    expect(tailwindTokens.backgroundColor.base).toBe('#F8F5F1');
    expect('base' in tailwindTokens.colors).toBe(false);
  });

  it('exposes brand/danger DEFAULT to Tailwind through the shared colors map', () => {
    expect(tailwindTokens.colors.brand.DEFAULT).toBe('#141E5A');
    expect(tailwindTokens.colors.danger.DEFAULT).toBe('#fa2d14');
  });
});
