import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { StepIndicator } from './step-indicator.js';

describe('StepIndicator', () => {
  const steps = ['Upload', 'Merge', 'Download'];

  it('renders every step label', () => {
    const html = renderToStaticMarkup(<StepIndicator steps={steps} currentStep={0} />);
    for (const step of steps) {
      expect(html).toContain(step);
    }
  });

  it('marks the currentStep index as current', () => {
    const html = renderToStaticMarkup(<StepIndicator steps={steps} currentStep={1} />);
    expect(html).toContain('data-state="current"');
    expect(html).toContain('data-state="complete"');
    expect(html).toContain('data-state="upcoming"');
  });

  it('gives each of the three states a visually distinct label color', () => {
    const html = renderToStaticMarkup(<StepIndicator steps={steps} currentStep={1} />);
    // complete (index 0)
    expect(html).toContain('text-brand');
    // current (index 1)
    expect(html).toContain('text-neutral-900');
    // upcoming (index 2)
    expect(html).toContain('text-neutral-400');
  });

  it('renders a checkmark instead of a number for complete steps', () => {
    const html = renderToStaticMarkup(<StepIndicator steps={steps} currentStep={2} />);
    expect(html).toContain('polyline points="1 4 3.5 6.5 9 1"');
  });

  it('renders no complete state when currentStep is 0', () => {
    const html = renderToStaticMarkup(<StepIndicator steps={steps} currentStep={0} />);
    expect(html).not.toContain('data-state="complete"');
    expect(html).toContain('data-state="current"');
    expect(html).toContain('data-state="upcoming"');
  });

  it('renders all steps as complete once currentStep passes the last index', () => {
    const html = renderToStaticMarkup(<StepIndicator steps={steps} currentStep={steps.length} />);
    expect(html).not.toContain('data-state="current"');
    expect(html).not.toContain('data-state="upcoming"');
    expect(html).toContain('data-state="complete"');
  });
});
