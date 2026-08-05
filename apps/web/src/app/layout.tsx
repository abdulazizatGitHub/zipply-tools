/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */
import '@toolforge/ui/styles.css';
import './globals.css';

import { Plus_Jakarta_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'Zipply — Free Online Tools',
    template: '%s · Zipply',
  },
  description:
    'Free online tools for PDF, images, and more. No sign-up. No watermarks. Files deleted automatically.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
