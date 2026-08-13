/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */

import { Comparison } from './_home/comparison';
import { Hero } from './_home/hero';
import { HomeFooter } from './_home/home-footer';
import { HowItWorks } from './_home/how-it-works';
import { ToolCards } from './_home/tool-cards';
import { SiteNav } from '../components/site-nav';

import type { ReactElement } from 'react';

export default function HomePage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-base">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <ToolCards />
        <HowItWorks />
        <Comparison />
      </main>
      <HomeFooter />
    </div>
  );
}
