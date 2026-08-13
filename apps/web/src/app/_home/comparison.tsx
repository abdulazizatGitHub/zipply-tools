import { IconCheck } from '../../components/icons';

import type { ReactElement } from 'react';

/**
 * Zipply-only claims — no named competitors. Every "Typical free PDF sites" cell describes a
 * category tendency ("often", "usually", "common"), not a specific product, and every "Zipply"
 * cell is true of this product today (see DECISIONS.md / ZIPPLY_CONTEXT.md).
 */
const ROWS = [
  {
    label: 'Account required',
    zipply: 'No',
    typical: 'Often required',
  },
  {
    label: 'Watermarks on your files',
    zipply: 'Never',
    typical: 'Common on the free tier',
  },
  {
    label: 'Daily usage limits',
    zipply: 'None',
    typical: 'Often capped',
  },
  {
    label: 'File retention',
    zipply: 'Auto-deleted within the hour',
    typical: 'Not always clear',
  },
  {
    label: 'QR code generation',
    zipply: 'Happens in your browser — nothing is uploaded',
    typical: 'Usually generated on a server',
  },
] as const;

export function Comparison(): ReactElement {
  return (
    <section className="bg-base px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">Where Zipply stands.</h2>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-neutral-200 bg-neutral-0">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th scope="col" className="px-5 py-4 font-semibold text-neutral-500">
                  <span className="sr-only">What matters</span>
                </th>
                <th scope="col" className="px-5 py-4 font-semibold text-brand">
                  Zipply
                </th>
                <th scope="col" className="px-5 py-4 font-semibold text-neutral-500">
                  Typical free PDF sites
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ label, zipply, typical }, index) => (
                <tr key={label} className={index > 0 ? 'border-t border-neutral-100' : undefined}>
                  <th scope="row" className="px-5 py-4 font-medium text-neutral-800">
                    {label}
                  </th>
                  <td className="px-5 py-4 text-neutral-800">
                    <span className="flex items-center gap-2">
                      <IconCheck className="h-4 w-4 flex-shrink-0 text-brand" />
                      {zipply}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-neutral-500">{typical}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
