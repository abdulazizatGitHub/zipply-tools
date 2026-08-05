/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */
// QR rendering (custom-qr-code library) + hand-drawn SVG frame templates
// + content-string formatters for the QR generator.

import { CustomQRCode } from 'custom-qr-code';

import type { CornerDotType, CornerSquareType, DotType } from 'custom-qr-code';

/* ── Rendering types ─────────────────────────────────────────────────── */
export type DotStyle = DotType;
export type CornerStyle = CornerSquareType;

export type FrameTemplate =
  | 'none'
  | 'scan-me-bottom' // colored band bottom with label text
  | 'scan-me-top' // colored band top with label text
  | 'scan-me-both' // top + bottom banners
  | 'circle-frame' // circular border stroke around QR, no text
  | 'rounded-frame' // rounded rectangle border + bottom text
  | 'bracket-frame' // corner bracket marks (tech style) + bottom text
  | 'speech-bubble' // speech bubble shape with pointer + bottom text
  | 'badge'; // circular badge with thick ring + bottom text

export type SocialPreset =
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'youtube'
  | 'whatsapp'
  | 'linktree';

export interface QrRenderOptions {
  content: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  size: number;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  fgColor: string;
  bgColor: string;
  frameTemplate: FrameTemplate;
  frameColor: string;
  frameText: string;
  logoUrl?: string | null;
  // When set, a branded social card (see buildSocialCard) is rendered
  // instead of the frame template, and the QR's own dot/corner/background
  // colors are overridden to the platform's brand colors (see
  // PLATFORM_QR_COLORS) instead of fgColor/bgColor.
  socialPreset?: SocialPreset | null;
  socialHandle?: string;
}

// cornersDotOptions only supports 'dot' | 'square' — 'extra-rounded' has no dot-corner
// equivalent in the library, so it falls back to the closest visual match ('dot').
function cornerDotType(cornerStyle: CornerStyle): CornerDotType {
  return cornerStyle === 'extra-rounded' ? 'dot' : cornerStyle;
}

function buildQrCode(
  opts: QrRenderOptions,
  sizePx: number,
  fgColor: string,
  bgColor: string,
  cornerColor: string,
): CustomQRCode {
  return new CustomQRCode({
    width: sizePx,
    height: sizePx,
    type: 'svg',
    data: opts.content,
    qrOptions: { errorCorrectionLevel: opts.errorCorrectionLevel },
    dotsOptions: { type: opts.dotStyle, color: fgColor },
    cornersSquareOptions: { type: opts.cornerStyle, color: cornerColor },
    cornersDotOptions: { type: cornerDotType(opts.cornerStyle), color: cornerColor },
    backgroundOptions: { color: bgColor },
    ...(opts.logoUrl
      ? {
          image: opts.logoUrl,
          imageOptions: {
            crossOrigin: 'anonymous',
            imageSize: 0.3,
            margin: 4,
          },
        }
      : {}),
  });
}

// When a social preset is active, the QR itself is re-colored to match the
// platform's brand instead of the user's fg/bg picks (see PLATFORM_QR_COLORS
// below, defined alongside SOCIAL_CARD_CONFIGS).
function resolveQrColors(opts: QrRenderOptions): {
  fgColor: string;
  bgColor: string;
  cornerColor: string;
} {
  const platform = opts.socialPreset ? PLATFORM_QR_COLORS[opts.socialPreset] : null;
  const fgColor = platform?.fgColor ?? opts.fgColor;
  const bgColor = platform?.bgColor ?? opts.bgColor;
  const cornerColor = platform?.cornerColor ?? fgColor;
  return { fgColor, bgColor, cornerColor };
}

/**
 * Renders just the QR (no frame) at `sizePx` and returns its raw SVG markup,
 * via the library's own public `getRawData('svg')` API — this already awaits
 * the library's internal drawing promise, so there's no need for an
 * offscreen DOM element or an arbitrary settle timeout.
 */
async function getQrSvgString(opts: QrRenderOptions, sizePx: number): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const { fgColor, bgColor, cornerColor } = resolveQrColors(opts);
  const qrCode = buildQrCode(opts, sizePx, fgColor, bgColor, cornerColor);
  const blob = await qrCode.getRawData('svg');
  if (!blob) return null;
  const text = await blob.text();
  // getRawData('svg') prefixes an XML prolog (`<?xml ...?>`), which is only
  // valid at the very start of a document — it would break once this string
  // is embedded mid-document inside the frame wrapper svg.
  return text.replace(/^<\?xml[^>]*\?>\s*/, '');
}

/* ── Frame templates (hand-drawn SVG wrappers around the QR) ─────────── */
interface FramedSvg {
  svg: string;
  width: number;
  height: number;
}

// Template-literal numeric interpolation is banned by this repo's lint config
// (@typescript-eslint/restrict-template-expressions) — `.toString()` sidesteps
// that (the rule only flags template-literal expressions, not method calls).
function px(n: number): string {
  return n.toString();
}

/**
 * All "chrome" pixel constants below (padding, banner heights, stroke
 * widths, font sizes...) are tuned for a 280px QR. `k` rescales them
 * proportionally for other sizes (e.g. the 800px download) so the frame
 * doesn't end up as a hairline border with illegibly small text.
 */
function buildFramedSvg(
  qrSvg: string,
  qrSize: number,
  frame: FrameTemplate,
  frameColor: string,
  frameText: string,
  bgColor: string,
): FramedSvg {
  const k = qrSize / 280;
  const text = (frameText || 'SCAN ME').toUpperCase();
  const pad = 16 * k;

  if (frame === 'none') {
    return { svg: qrSvg, width: qrSize, height: qrSize };
  }

  if (frame === 'scan-me-bottom' || frame === 'scan-me-top') {
    const bannerH = 56 * k;
    const fontSize = 22 * k;
    const radius = 12 * k;
    const totalW = qrSize + pad * 2;
    const totalH = qrSize + pad + bannerH;
    const qrY = frame === 'scan-me-top' ? bannerH + pad / 2 : pad / 2;
    const bannerY = frame === 'scan-me-top' ? 0 : qrSize + pad;
    const bannerTextY = bannerY + bannerH / 2;
    const seamRect =
      frame === 'scan-me-top'
        ? `<rect y="${px(bannerH - radius)}" width="${px(totalW)}" height="${px(radius)}" fill="${frameColor}"/>`
        : `<rect y="${px(bannerY)}" width="${px(totalW)}" height="${px(radius)}" fill="${frameColor}"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(totalW)}" height="${px(totalH)}" viewBox="0 0 ${px(totalW)} ${px(totalH)}">
      <rect width="${px(totalW)}" height="${px(totalH)}" fill="${bgColor}" rx="${px(radius)}"/>
      <rect y="${px(bannerY)}" width="${px(totalW)}" height="${px(bannerH)}" fill="${frameColor}" rx="${frame === 'scan-me-top' ? px(radius) : '0'}"/>
      ${seamRect}
      <text x="${px(totalW / 2)}" y="${px(bannerTextY)}" font-family="Arial,sans-serif" font-size="${px(fontSize)}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="${px(3 * k)}">${text}</text>
      <g transform="translate(${px(pad)},${px(qrY)})">${qrSvg}</g>
    </svg>`;
    return { svg, width: totalW, height: totalH };
  }

  if (frame === 'scan-me-both') {
    const bannerH = 52 * k;
    const fontSize = 18 * k;
    const radius = 12 * k;
    const totalW = qrSize + pad * 2;
    const totalH = qrSize + bannerH * 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(totalW)}" height="${px(totalH)}" viewBox="0 0 ${px(totalW)} ${px(totalH)}">
      <rect width="${px(totalW)}" height="${px(totalH)}" fill="${bgColor}" rx="${px(radius)}"/>
      <rect width="${px(totalW)}" height="${px(bannerH)}" fill="${frameColor}" rx="${px(radius)}"/>
      <rect y="${px(bannerH - radius * 0.7)}" width="${px(totalW)}" height="${px(radius * 0.7)}" fill="${frameColor}"/>
      <text x="${px(totalW / 2)}" y="${px(bannerH / 2)}" font-family="Arial,sans-serif" font-size="${px(fontSize)}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="${px(2 * k)}">${text}</text>
      <g transform="translate(${px(pad)},${px(bannerH)})">${qrSvg}</g>
      <rect y="${px(bannerH + qrSize)}" width="${px(totalW)}" height="${px(bannerH)}" fill="${frameColor}"/>
      <rect y="${px(totalH - radius * 0.7)}" width="${px(totalW)}" height="${px(radius * 0.7)}" fill="${frameColor}" rx="${px(radius)}"/>
      <text x="${px(totalW / 2)}" y="${px(bannerH + qrSize + bannerH / 2)}" font-family="Arial,sans-serif" font-size="${px(14 * k)}" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="${px(k)}">${text}</text>
    </svg>`;
    return { svg, width: totalW, height: totalH };
  }

  if (frame === 'rounded-frame') {
    const border = 8 * k;
    const bottomH = 48 * k;
    const fontSize = 18 * k;
    const totalW = qrSize + pad * 2;
    const totalH = qrSize + pad * 2 + bottomH;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(totalW)}" height="${px(totalH)}" viewBox="0 0 ${px(totalW)} ${px(totalH)}">
      <rect x="${px(border / 2)}" y="${px(border / 2)}" width="${px(totalW - border)}" height="${px(totalH - border)}" fill="${bgColor}" rx="${px(20 * k)}" stroke="${frameColor}" stroke-width="${px(border)}"/>
      <text x="${px(totalW / 2)}" y="${px(totalH - bottomH / 2)}" font-family="Arial,sans-serif" font-size="${px(fontSize)}" font-weight="bold" fill="${frameColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${px(2 * k)}">${text}</text>
      <g transform="translate(${px(pad)},${px(pad)})">${qrSvg}</g>
    </svg>`;
    return { svg, width: totalW, height: totalH };
  }

  if (frame === 'circle-frame') {
    // A square QR inscribed edge-to-edge in a circle has its corners at
    // (qrSize/2)*sqrt(2) from center — well past a radius of qrSize/2 plus a
    // small pad. Shrink the QR (via transform scale) so its corners, not
    // just its edges, stay inside the ring.
    const innerQrSize = Math.round(qrSize * 0.72);
    const strokeW = Math.round(qrSize * 0.04);
    const radius = qrSize / 2 + Math.round(qrSize * 0.08);
    const totalSize = Math.round(radius * 2 + 8);
    const center = totalSize / 2;
    const scale = innerQrSize / qrSize;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(totalSize)}" height="${px(totalSize)}" viewBox="0 0 ${px(totalSize)} ${px(totalSize)}">
      <circle cx="${px(center)}" cy="${px(center)}" r="${px(radius)}" fill="${bgColor}" stroke="${frameColor}" stroke-width="${px(strokeW)}"/>
      <g transform="translate(${px(center - innerQrSize / 2)},${px(center - innerQrSize / 2)}) scale(${scale.toFixed(4)})">${qrSvg}</g>
    </svg>`;
    return { svg, width: totalSize, height: totalSize };
  }

  if (frame === 'bracket-frame') {
    const arm = 32 * k;
    const strokeW = 6 * k;
    const bottomH = 48 * k;
    const fontSize = 18 * k;
    const totalW = qrSize + pad * 2;
    const totalH = qrSize + pad * 2 + bottomH;
    const x = pad;
    const y = pad;
    const w = qrSize;
    const h = qrSize;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(totalW)}" height="${px(totalH)}" viewBox="0 0 ${px(totalW)} ${px(totalH)}">
      <rect width="${px(totalW)}" height="${px(totalH)}" fill="${bgColor}"/>
      <path d="M${px(x)},${px(y + arm)} L${px(x)},${px(y)} L${px(x + arm)},${px(y)}" fill="none" stroke="${frameColor}" stroke-width="${px(strokeW)}" stroke-linecap="square"/>
      <path d="M${px(x + w - arm)},${px(y)} L${px(x + w)},${px(y)} L${px(x + w)},${px(y + arm)}" fill="none" stroke="${frameColor}" stroke-width="${px(strokeW)}" stroke-linecap="square"/>
      <path d="M${px(x)},${px(y + h - arm)} L${px(x)},${px(y + h)} L${px(x + arm)},${px(y + h)}" fill="none" stroke="${frameColor}" stroke-width="${px(strokeW)}" stroke-linecap="square"/>
      <path d="M${px(x + w - arm)},${px(y + h)} L${px(x + w)},${px(y + h)} L${px(x + w)},${px(y + h - arm)}" fill="none" stroke="${frameColor}" stroke-width="${px(strokeW)}" stroke-linecap="square"/>
      <text x="${px(totalW / 2)}" y="${px(totalH - bottomH / 2)}" font-family="Arial,sans-serif" font-size="${px(fontSize)}" font-weight="bold" fill="${frameColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${px(2 * k)}">${text}</text>
      <g transform="translate(${px(x)},${px(y)})">${qrSvg}</g>
    </svg>`;
    return { svg, width: totalW, height: totalH };
  }

  if (frame === 'badge') {
    // Same square-corners-vs-circle problem as circle-frame — shrink the QR
    // so its corners stay inside the accent ring, not just its edges.
    const innerQrSize = Math.round(qrSize * 0.65);
    const scale = innerQrSize / qrSize;
    const outerR = Math.round(qrSize / 2 + qrSize * 0.12);
    const totalDiameter = outerR * 2 + 8;
    const center = totalDiameter / 2;
    const bannerH = Math.round(qrSize * 0.14);
    const bannerY = totalDiameter + Math.round(qrSize * 0.02);
    const bannerW = Math.max(Math.round(qrSize * 0.56), text.length * 11 * k + 40 * k);
    const totalH = bannerY + bannerH;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(totalDiameter)}" height="${px(totalH)}" viewBox="0 0 ${px(totalDiameter)} ${px(totalH)}">
      <circle cx="${px(center)}" cy="${px(center)}" r="${px(outerR)}" fill="${frameColor}"/>
      <circle cx="${px(center)}" cy="${px(center)}" r="${px(outerR - Math.round(qrSize * 0.045))}" fill="${bgColor}"/>
      <circle cx="${px(center)}" cy="${px(center)}" r="${px(outerR - Math.round(qrSize * 0.06))}" fill="none" stroke="${frameColor}" stroke-width="${px(Math.round(qrSize * 0.012))}"/>
      <g transform="translate(${px(center - innerQrSize / 2)},${px(center - innerQrSize / 2)}) scale(${scale.toFixed(4)})">${qrSvg}</g>
      <rect x="${px(center - bannerW / 2)}" y="${px(bannerY)}" width="${px(bannerW)}" height="${px(bannerH)}" fill="${frameColor}" rx="${px(bannerH / 2)}"/>
      <text x="${px(center)}" y="${px(bannerY + bannerH / 2)}" font-family="Arial,sans-serif" font-size="${px(Math.round(qrSize * 0.072))}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="${px(Math.round(qrSize * 0.008))}">${text}</text>
    </svg>`;
    return { svg, width: totalDiameter, height: totalH };
  }

  // 'speech-bubble'
  const bubbleH = qrSize + pad * 2;
  const pointerH = 32 * k;
  const bottomH = 48 * k;
  const totalW = qrSize + pad * 2;
  const totalH = bubbleH + pointerH + bottomH;
  const radius = 16 * k;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(totalW)}" height="${px(totalH)}" viewBox="0 0 ${px(totalW)} ${px(totalH)}">
    <rect width="${px(totalW)}" height="${px(bubbleH)}" fill="${frameColor}" rx="${px(radius)}"/>
    <polygon points="${px(totalW * 0.35)},${px(bubbleH)} ${px(totalW * 0.5)},${px(bubbleH + pointerH)} ${px(totalW * 0.65)},${px(bubbleH)}" fill="${frameColor}"/>
    <rect x="${px(6 * k)}" y="${px(6 * k)}" width="${px(totalW - 12 * k)}" height="${px(bubbleH - 12 * k)}" fill="${bgColor}" rx="${px(12 * k)}"/>
    <text x="${px(totalW / 2)}" y="${px(totalH - bottomH / 2)}" font-family="Arial,sans-serif" font-size="${px(16 * k)}" font-weight="bold" fill="${frameColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${px(k)}">${text}</text>
    <g transform="translate(${px(pad)},${px(pad)})">${qrSvg}</g>
  </svg>`;
  return { svg, width: totalW, height: totalH };
}

/* ── Social cards (branded platform layouts, QR embedded inside) ─────── */
interface SocialCardConfig {
  headerBg: string;
  gradientDefs: string;
  // (x, headerH, k) — left inset for the icon, the header band's own height
  // (so each icon can center itself around headerH/2 with its own offset —
  // a translated shape group anchors top-left, a <text> anchors its baseline,
  // so these need different deltas from the header's vertical center), and
  // the qrSize/280 scale factor.
  iconSvg: (x: number, headerH: number, k: number) => string;
  cta: string;
  accent: string;
}

// Brand colors the QR itself is re-colored to when a social preset is active
// (see resolveQrColors) — dots, corners, and the QR's own background, so the
// code visually matches the platform instead of always rendering plain
// black-on-white inside the branded card.
const PLATFORM_QR_COLORS: Record<
  SocialPreset,
  { fgColor: string; bgColor: string; cornerColor?: string }
> = {
  instagram: { fgColor: '#833ab4', bgColor: '#ffffff', cornerColor: '#e1306c' },
  tiktok: { fgColor: '#69c9d0', bgColor: '#000000' },
  linkedin: { fgColor: '#0077b5', bgColor: '#ffffff' },
  twitter: { fgColor: '#000000', bgColor: '#ffffff' },
  facebook: { fgColor: '#1877f2', bgColor: '#ffffff' },
  youtube: { fgColor: '#ff0000', bgColor: '#ffffff' },
  whatsapp: { fgColor: '#25d366', bgColor: '#ffffff' },
  linktree: { fgColor: '#39e09b', bgColor: '#ffffff' },
};

const SOCIAL_CARD_CONFIGS: Record<SocialPreset, SocialCardConfig> = {
  instagram: {
    headerBg: 'url(#igGrad)',
    gradientDefs: `<linearGradient id="igGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f9ce34"/>
      <stop offset="50%" stop-color="#ee2a7b"/>
      <stop offset="100%" stop-color="#6228d7"/>
    </linearGradient>`,
    iconSvg: (x, headerH, k) => `<g transform="translate(${px(x)},${px(headerH / 2 - 18 * k)})">
      <rect width="${px(36 * k)}" height="${px(36 * k)}" rx="${px(10 * k)}" fill="none" stroke="white" stroke-width="${px(3 * k)}"/>
      <circle cx="${px(18 * k)}" cy="${px(18 * k)}" r="${px(8 * k)}" fill="none" stroke="white" stroke-width="${px(2.5 * k)}"/>
      <circle cx="${px(27 * k)}" cy="${px(9 * k)}" r="${px(2 * k)}" fill="white"/>
    </g>`,
    cta: 'Scan to follow on Instagram',
    accent: '#ee2a7b',
  },
  tiktok: {
    headerBg: '#000000',
    gradientDefs: '',
    iconSvg: (
      x,
      headerH,
      k,
    ) => `<rect x="${px(16 * k)}" y="0" width="${px(4 * k)}" height="${px(headerH)}" fill="#69c9d0"/>
      <text x="${px(x)}" y="${px(headerH / 2 + 7 * k)}" font-family="Arial,sans-serif" font-size="${px(26 * k)}" font-weight="bold" fill="white">TikTok</text>`,
    cta: 'Scan to follow on TikTok',
    accent: '#69c9d0',
  },
  linkedin: {
    headerBg: '#0077b5',
    gradientDefs: '',
    iconSvg: (x, headerH, k) =>
      `<text x="${px(x)}" y="${px(headerH / 2 + 10 * k)}" font-family="Arial,sans-serif" font-size="${px(32 * k)}" font-weight="bold" fill="white">in</text>`,
    cta: 'Scan to connect on LinkedIn',
    accent: '#0077b5',
  },
  twitter: {
    headerBg: '#000000',
    gradientDefs: '',
    iconSvg: (x, headerH, k) => `<g transform="translate(${px(x)},${px(headerH / 2 - 14 * k)})">
      <line x1="0" y1="0" x2="${px(28 * k)}" y2="${px(28 * k)}" stroke="white" stroke-width="${px(4 * k)}" stroke-linecap="round"/>
      <line x1="${px(28 * k)}" y1="0" x2="0" y2="${px(28 * k)}" stroke="white" stroke-width="${px(4 * k)}" stroke-linecap="round"/>
    </g>`,
    cta: 'Scan to follow on X',
    accent: '#000000',
  },
  facebook: {
    headerBg: '#1877f2',
    gradientDefs: '',
    iconSvg: (x, headerH, k) =>
      `<text x="${px(x)}" y="${px(headerH / 2 + 14 * k)}" font-family="Arial,sans-serif" font-size="${px(42 * k)}" font-weight="bold" fill="white">f</text>`,
    cta: 'Scan to follow on Facebook',
    accent: '#1877f2',
  },
  youtube: {
    headerBg: '#ff0000',
    gradientDefs: '',
    iconSvg: (x, headerH, k) => `<g transform="translate(${px(x)},${px(headerH / 2 - 16 * k)})">
      <rect width="${px(44 * k)}" height="${px(32 * k)}" rx="${px(7 * k)}" fill="white"/>
      <polygon points="${px(17 * k)},${px(9 * k)} ${px(17 * k)},${px(23 * k)} ${px(33 * k)},${px(16 * k)}" fill="#ff0000"/>
    </g>`,
    cta: 'Scan to watch on YouTube',
    accent: '#ff0000',
  },
  whatsapp: {
    headerBg: '#25d366',
    gradientDefs: '',
    // Simplified speech-bubble-with-tail glyph (rect + polygon) — no emoji.
    iconSvg: (x, headerH, k) => `<g transform="translate(${px(x)},${px(headerH / 2 - 16 * k)})">
      <rect width="${px(32 * k)}" height="${px(24 * k)}" rx="${px(7 * k)}" fill="white"/>
      <polygon points="${px(8 * k)},${px(24 * k)} ${px(8 * k)},${px(32 * k)} ${px(17 * k)},${px(24 * k)}" fill="white"/>
    </g>`,
    cta: 'Scan to message on WhatsApp',
    accent: '#25d366',
  },
  linktree: {
    headerBg: '#39e09b',
    gradientDefs: '',
    iconSvg: (x, headerH, k) => `<g transform="translate(${px(x)},${px(headerH / 2 - 14 * k)})">
      <rect x="${px(11 * k)}" y="${px(14 * k)}" width="${px(6 * k)}" height="${px(14 * k)}" fill="white" rx="${px(2 * k)}"/>
      <rect x="${px(4 * k)}" y="${px(6 * k)}" width="${px(20 * k)}" height="${px(6 * k)}" fill="white" rx="${px(3 * k)}"/>
      <rect x="${px(4 * k)}" y="0" width="${px(20 * k)}" height="${px(5 * k)}" fill="white" rx="${px(2.5 * k)}"/>
    </g>`,
    cta: 'Scan to see all links',
    accent: '#39e09b',
  },
};

function buildSocialCard(
  qrSvg: string,
  qrSize: number,
  preset: SocialPreset,
  handle: string,
  qrBgColor: string,
): FramedSvg {
  const k = qrSize / 280;
  const pad = Math.round(20 * k);
  const headerH = Math.round(80 * k);
  const footerH = Math.round(52 * k);
  const cardW = qrSize + pad * 2;
  const cardH = qrSize + pad * 2 + headerH + footerH;
  const r = Math.round(16 * k);
  const qrX = pad;
  const qrY = headerH + pad;
  const footerY = headerH + qrSize + pad * 2;
  const fontSize = Math.round(15 * k);
  const handleSize = Math.round(18 * k);

  const cfg = SOCIAL_CARD_CONFIGS[preset];
  const displayHandle = handle ? `@${handle.replace(/^@/, '')}` : '';
  const headerClipId = `headerClip-${preset}`;
  const footerClipId = `footerClip-${preset}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(cardW)}" height="${px(cardH)}" viewBox="0 0 ${px(cardW)} ${px(cardH)}">
    <defs>
      ${cfg.gradientDefs}
      <clipPath id="${headerClipId}">
        <rect width="${px(cardW)}" height="${px(headerH)}" rx="${px(r)}"/>
        <rect y="${px(Math.round(r / 2))}" width="${px(cardW)}" height="${px(headerH - Math.round(r / 2))}"/>
      </clipPath>
      <clipPath id="${footerClipId}">
        <rect x="0" y="${px(footerY)}" width="${px(cardW)}" height="${px(footerH)}" rx="${px(r)}"/>
        <rect x="0" y="${px(footerY)}" width="${px(cardW)}" height="${px(footerH - r)}"/>
      </clipPath>
    </defs>
    <rect width="${px(cardW)}" height="${px(cardH)}" fill="#f0f0f0" rx="${px(r)}"/>
    <rect width="${px(cardW)}" height="${px(cardH)}" fill="white" rx="${px(r)}"/>
    <rect width="${px(cardW)}" height="${px(headerH)}" fill="${cfg.headerBg}" clip-path="url(#${headerClipId})"/>
    ${cfg.iconSvg(Math.round(24 * k), headerH, k)}
    ${displayHandle ? `<text x="${px(cardW - Math.round(20 * k))}" y="${px(Math.round(headerH / 2 + 6 * k))}" font-family="Arial,sans-serif" font-size="${px(handleSize)}" fill="white" text-anchor="end" opacity="0.9">${displayHandle}</text>` : ''}
    <rect x="${px(Math.round(pad * 0.5))}" y="${px(headerH + Math.round(pad * 0.5))}" width="${px(qrSize + pad)}" height="${px(qrSize + pad)}" fill="${qrBgColor}" rx="${px(Math.round(8 * k))}"/>
    <g transform="translate(${px(qrX)},${px(qrY)})">${qrSvg}</g>
    <rect x="0" y="${px(footerY)}" width="${px(cardW)}" height="${px(footerH)}" fill="${cfg.accent}" opacity="0.1" clip-path="url(#${footerClipId})"/>
    <text x="${px(cardW / 2)}" y="${px(footerY + footerH / 2)}" font-family="Arial,sans-serif" font-size="${px(fontSize)}" fill="${cfg.accent}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${cfg.cta}</text>
  </svg>`;

  return { svg, width: cardW, height: cardH };
}

// A social card, when set, always takes priority over the frame template —
// the QR's own dot/background colors still come from opts, but the card
// chrome uses the platform's fixed brand design instead of a hand-picked frame.
function buildFinalSvg(qrSvg: string, qrSize: number, opts: QrRenderOptions): FramedSvg {
  if (opts.socialPreset) {
    const qrBgColor = PLATFORM_QR_COLORS[opts.socialPreset].bgColor;
    return buildSocialCard(qrSvg, qrSize, opts.socialPreset, opts.socialHandle ?? '', qrBgColor);
  }
  return buildFramedSvg(
    qrSvg,
    qrSize,
    opts.frameTemplate,
    opts.frameColor,
    opts.frameText,
    opts.bgColor,
  );
}

/* ── Preview render ───────────────────────────────────────────────────── */
/**
 * `isStale`, if given, is checked after the (async — a logo image may still
 * be loading) QR render completes. If it returns true, a newer render was
 * already kicked off for this container and this one must not clobber it.
 */
export async function renderFramedQr(
  container: HTMLDivElement,
  opts: QrRenderOptions,
  isStale?: () => boolean,
): Promise<void> {
  const qrSvg = await getQrSvgString(opts, opts.size);
  if (!qrSvg || isStale?.()) return;

  const { svg } = buildFinalSvg(qrSvg, opts.size, opts);

  if (isStale?.()) return;
  container.innerHTML = svg;

  // Frame templates aren't all square (badges/bubbles/double-banners add
  // extra height), so scale like `object-fit: contain` — bounded by the
  // container on both axes, but sized from the viewBox to keep its own
  // aspect ratio rather than being stretched to fill a square box.
  const rootSvg = container.querySelector('svg');
  if (rootSvg) {
    rootSvg.style.display = 'block';
    rootSvg.style.width = 'auto';
    rootSvg.style.height = 'auto';
    rootSvg.style.maxWidth = '100%';
    rootSvg.style.maxHeight = '100%';
  }
}

/* ── Download (rasterizes the assembled frame SVG to PNG) ───────────── */
export async function downloadQrCode(opts: QrRenderOptions, filename = 'zipply-qr'): Promise<void> {
  const qrSvg = await getQrSvgString(opts, opts.size);
  if (!qrSvg) return;

  const { svg, width, height } = buildFinalSvg(qrSvg, opts.size, opts);

  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => {
        resolve(el);
      };
      el.onerror = () => {
        reject(new Error('Failed to rasterize QR frame'));
      };
      el.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, width, height);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${filename}.png`;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ── Content formatters (unrelated to rendering; used by the content forms) ── */
export type ContentType = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms';

export interface WifiInput {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}
export interface VCardInput {
  name: string;
  phone: string;
  email: string;
  company: string;
  title: string;
  website: string;
}
export interface EmailInput {
  to: string;
  subject: string;
  body: string;
}
export interface SmsInput {
  number: string;
  message: string;
}

export function formatContent(type: ContentType, data: unknown): string {
  switch (type) {
    case 'url':
    case 'text':
      return String(data);
    case 'wifi': {
      const w = data as WifiInput;
      const esc = (s: string) => s.replace(/[\\;,"]/g, (c) => `\\${c}`);
      return `WIFI:T:${w.security};S:${esc(w.ssid)};P:${esc(w.password)};H:${String(w.hidden)};`;
    }
    case 'vcard': {
      const v = data as VCardInput;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${v.name}`,
        v.company ? `ORG:${v.company}` : '',
        v.title ? `TITLE:${v.title}` : '',
        v.phone ? `TEL:${v.phone}` : '',
        v.email ? `EMAIL:${v.email}` : '',
        v.website ? `URL:${v.website}` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'email': {
      const e = data as EmailInput;
      const p = new URLSearchParams();
      if (e.subject) p.set('subject', e.subject);
      if (e.body) p.set('body', e.body);
      const qs = p.toString();
      return `mailto:${e.to}${qs ? `?${qs}` : ''}`;
    }
    case 'phone':
      return `tel:${String(data)}`;
    case 'sms': {
      const s = data as SmsInput;
      return `sms:${s.number}${s.message ? `?body=${encodeURIComponent(s.message)}` : ''}`;
    }
    default:
      return String(data);
  }
}
