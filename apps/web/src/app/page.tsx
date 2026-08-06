/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */
import Link from 'next/link';
import type { ReactElement } from 'react';

import { SiteNav } from '../components/site-nav';
import {
  IconArrowRight,
  IconClock,
  IconDownload,
  IconMerge,
  IconQr,
  IconShield,
  IconSplit,
  IconUpload,
  IconZap,
} from '../components/icons';

/* ─────────────────────────────────────────────────────────────────────────── */

const LIVE_TOOLS = [
  {
    id: 'pdf-merge',
    href: '/pdf-merge',
    category: 'PDF',
    name: 'PDF Merge',
    tagline: 'Combine multiple PDFs into one file, in the order you choose.',
    Icon: IconMerge,
    gradient: 'from-brand-600 to-brand-500',
    glow: 'rgba(5,150,105,0.25)',
    steps: ['Drop files', 'Reorder', 'Download'],
  },
  {
    id: 'qr-generator',
    href: '/qr-generator',
    category: 'QR',
    name: 'QR Generator',
    tagline: 'Custom shapes, card templates, social frames. Instant PNG download.',
    Icon: IconQr,
    gradient: 'from-violet-600 to-brand-500',
    glow: 'rgba(124,58,237,0.22)',
    steps: ['Enter content', 'Style', 'Download card'],
  },
  {
    id: 'pdf-split',
    href: '/pdf-split',
    category: 'PDF',
    name: 'PDF Split',
    tagline: 'Extract pages or split a PDF into separate files by range.',
    Icon: IconSplit,
    gradient: 'from-violet-600 to-violet-500',
    glow: 'rgba(124,58,237,0.22)',
    steps: ['Upload', 'Set ranges', 'Download parts'],
  },
] as const;

const HOW_IT_WORKS = [
  {
    n: '01',
    Icon: IconUpload,
    title: 'Upload',
    desc: 'Drop your file. Stays in your browser session — never stored permanently.',
  },
  {
    n: '02',
    Icon: IconZap,
    title: 'Process',
    desc: 'Our servers handle the heavy lifting. Most files done in under two seconds.',
  },
  {
    n: '03',
    Icon: IconDownload,
    title: 'Download',
    desc: 'Grab your result. Files are deleted automatically within one hour.',
  },
] as const;

/* ─────────────────────────────────────────────────────────────────────────── */

export default function HomePage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-mesh">
        {/* Dot grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-100" />
        {/* Bottom fade into white */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-neutral-50" />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28">
          <div className="flex flex-col items-center text-center">
            {/* Pill badge */}
            <div className="animate-fade-up glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-neutral-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              2 tools live · 3 more shipping soon
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up delay-1 max-w-3xl text-5xl font-extrabold text-white sm:text-6xl lg:text-7xl"
              style={{ fontFamily: 'var(--font-display)', lineHeight: 1.08 }}
            >
              File tools that
              <br />
              <span className="text-gradient">just work.</span>
            </h1>

            <p className="animate-fade-up delay-2 mx-auto mt-6 max-w-xl text-base text-neutral-400 sm:text-lg">
              No sign-up. No watermarks. No subscription. Upload, process, download — then your
              files are gone.
            </p>

            {/* Hero CTAs */}
            <div className="animate-fade-up delay-3 mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/pdf-merge"
                className="group flex items-center gap-2.5 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(5,150,105,0.35)] transition-all hover:bg-brand-500 hover:shadow-[0_0_28px_rgba(16,185,129,0.45)]"
              >
                <IconMerge className="h-4 w-4" />
                Merge PDFs
                <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pdf-split"
                className="group flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.10]"
              >
                <IconSplit className="h-4 w-4" />
                Split PDFs
                <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Trust strip */}
            <div className="animate-fade-up delay-4 mt-12 flex flex-wrap items-center justify-center gap-6">
              {[
                { Icon: IconShield, text: 'Private by design' },
                { Icon: IconClock, text: 'Files deleted in 1 hr' },
                { Icon: IconZap, text: 'Processes in seconds' },
              ].map(({ Icon, text }) => (
                <span key={text} className="flex items-center gap-2 text-xs text-neutral-500">
                  <Icon className="h-3.5 w-3.5 text-neutral-600" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-neutral-200 bg-white py-5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: '100%', label: 'Free forever' },
              { value: '0', label: 'Sign-ups needed' },
              { value: '1 hr', label: 'File retention' },
              { value: '∞', label: 'Files per day' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p
                  className="text-2xl font-extrabold text-neutral-950"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {value}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools ────────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Tools
              </p>
              <h2
                className="text-3xl font-bold text-neutral-950"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Available now
              </h2>
            </div>
            <p className="hidden text-sm text-neutral-400 sm:block">3 more tools in development</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LIVE_TOOLS.map(
              ({ id, href, category, name, tagline, Icon, gradient, glow, steps }, i) => (
                <Link
                  key={id}
                  href={href}
                  className="card-lift glow-hover group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm"
                  style={{ animationDelay: `${String(i * 80)}ms` }}
                >
                  {/* Subtle gradient bleed in top-right corner */}
                  <div
                    className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${gradient} opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.14]`}
                  />

                  <div className="relative">
                    {/* Icon + category */}
                    <div className="mb-5 flex items-start justify-between">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-sm`}
                        style={{ boxShadow: `0 4px 14px ${glow}` }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        {category}
                      </span>
                    </div>

                    {/* Text */}
                    <h3
                      className="text-lg font-bold text-neutral-950 transition-colors group-hover:text-brand-700"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">{tagline}</p>

                    {/* Flow hint */}
                    <p className="mt-4 flex flex-wrap items-center gap-1 font-mono text-[11px] tracking-wide text-neutral-400">
                      {steps.map((s, si) => (
                        <span key={s} className="flex items-center gap-1">
                          {si > 0 && <IconArrowRight className="h-2.5 w-2.5" />}
                          {s}
                        </span>
                      ))}
                    </p>

                    {/* CTA */}
                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-600 transition-all group-hover:gap-3">
                      Open tool
                      <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-t border-neutral-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Process
            </p>
            <h2
              className="text-3xl font-bold text-neutral-950"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Three steps, every time.
            </h2>
          </div>
          <div className="grid gap-px bg-neutral-100 sm:grid-cols-3 rounded-2xl overflow-hidden border border-neutral-100">
            {HOW_IT_WORKS.map(({ n, Icon, title, desc }) => (
              <div key={n} className="flex flex-col gap-4 bg-white p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs font-bold tracking-widest text-neutral-300">
                    {n}
                  </span>
                </div>
                <div>
                  <h3
                    className="font-bold text-neutral-900"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-neutral-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600">
              <svg viewBox="0 0 16 16" fill="white" className="h-3 w-3" aria-hidden>
                <rect x="2" y="2" width="5" height="5" rx="1" opacity="0.9" />
                <rect x="9" y="2" width="5" height="5" rx="1" opacity="0.7" />
                <rect x="2" y="9" width="5" height="5" rx="1" opacity="0.7" />
                <rect x="9" y="9" width="5" height="5" rx="1" opacity="0.5" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-neutral-400">Zipply</span>
          </div>
          <p className="text-xs text-neutral-600">
            Free · No sign-up · No watermarks · Files auto-deleted · © {new Date().getFullYear()}{' '}
            Zipply
          </p>
        </div>
      </footer>
    </div>
  );
}
