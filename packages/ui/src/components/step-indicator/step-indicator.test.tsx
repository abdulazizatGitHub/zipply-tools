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
});
