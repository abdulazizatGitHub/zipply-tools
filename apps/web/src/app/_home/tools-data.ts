import { IconMerge, IconQr, IconSplit } from '../../components/icons';

import type { ComponentType } from 'react';

export interface HomeTool {
  id: string;
  href: string;
  name: string;
  tagline: string;
  Icon: ComponentType<{ className?: string }>;
}

export const HOME_TOOLS: HomeTool[] = [
  {
    id: 'pdf-merge',
    href: '/pdf-merge',
    name: 'PDF Merge',
    tagline: 'Combine multiple PDFs into one file, in the order you choose.',
    Icon: IconMerge,
  },
  {
    id: 'pdf-split',
    href: '/pdf-split',
    name: 'PDF Split',
    tagline: 'Extract pages or split a PDF into separate files by range.',
    Icon: IconSplit,
  },
  {
    id: 'qr-generator',
    href: '/qr-generator',
    name: 'QR Generator',
    tagline: 'Custom-styled QR codes generated entirely in your browser.',
    Icon: IconQr,
  },
];
