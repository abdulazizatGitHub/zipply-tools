import { StepIndicator } from '@toolforge/ui';

import { IconDownload, IconUpload, IconZap } from '../../components/icons';

import type { ReactElement } from 'react';

const STEPS = [
  {
    label: 'Upload',
    Icon: IconUpload,
    desc: 'Drop in a PDF, or enter what you want your QR code to link to.',
  },
  {
    label: 'Process',
    Icon: IconZap,
    desc: 'We merge, split, or render your QR code — most files done in seconds.',
  },
  {
    label: 'Download',
    Icon: IconDownload,
    desc: 'Get your result right away. Uploaded files are deleted within the hour.',
  },
] as const;

export function HowItWorks(): ReactElement {
  return (
    <section className="border-y border-neutral-200 bg-neutral-0 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-bold text-neutral-950 sm:text-3xl">
          Three steps, every time.
        </h2>

        <div className="mx-auto mt-10 max-w-lg">
          <StepIndicator steps={STEPS.map((step) => step.label)} currentStep={0} />
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ label, Icon, desc }) => (
            <div key={label} className="text-center sm:text-left">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand sm:mx-0">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-neutral-950">{label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
