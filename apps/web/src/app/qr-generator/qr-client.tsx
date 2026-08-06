'use client';
/**
 * Copyright (c) 2025 Zipply. All rights reserved.
 * Proprietary and confidential. Unauthorized use prohibited.
 * For licensing: abdulwork058@gmail.com
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  downloadQrCode,
  formatContent,
  renderFramedQr,
  type ContentType,
  type CornerStyle,
  type DotStyle,
  type EmailInput,
  type FrameTemplate,
  type SmsInput,
  type SocialPreset,
  type VCardInput,
  type WifiInput,
} from './qr-canvas';

import type { Dispatch, SetStateAction } from 'react';

/* ─── default style state ───────────────────────────────────────────── */
const DEF = {
  dotStyle: 'rounded' as DotStyle,
  cornerStyle: 'square' as CornerStyle,
  fgColor: '#000000',
  bgColor: '#ffffff',
  ecl: 'H' as const,
  frameTemplate: 'none' as FrameTemplate,
  frameColor: '#2f5fe6',
  frameText: 'SCAN ME',
};

/* ─── option metadata ───────────────────────────────────────────────── */
const DOT_STYLES: { id: DotStyle; label: string; preview: string }[] = [
  { id: 'square', label: 'Square', preview: '■' },
  { id: 'dots', label: 'Dots', preview: '●' },
  { id: 'rounded', label: 'Rounded', preview: '▪' },
  { id: 'classy', label: 'Classy', preview: '◆' },
  { id: 'classy-rounded', label: 'Classy+', preview: '❖' },
  { id: 'extra-rounded', label: 'Smooth', preview: '○' },
];

const CORNER_STYLES: { id: CornerStyle; label: string; preview: string }[] = [
  { id: 'square', label: 'Square', preview: '◻' },
  { id: 'dot', label: 'Dot', preview: '●' },
  { id: 'extra-rounded', label: 'Rounded', preview: '◯' },
];

const FRAME_TEMPLATES: { id: FrameTemplate; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'scan-me-bottom', label: 'Scan Me ↓' },
  { id: 'scan-me-top', label: 'Scan Me ↑' },
  { id: 'scan-me-both', label: 'Double ↕' },
  { id: 'rounded-frame', label: 'Rounded' },
  { id: 'circle-frame', label: 'Circle' },
  { id: 'bracket-frame', label: 'Brackets' },
  { id: 'badge', label: 'Badge' },
  { id: 'speech-bubble', label: 'Bubble' },
];

// Frame templates that render without a text label (no CTA text control shown for these).
const TEXTLESS_FRAMES = new Set<FrameTemplate>(['none', 'circle-frame']);

const SOCIAL_PLATFORMS: { id: SocialPreset | null; label: string; color: string }[] = [
  { id: null, label: 'None', color: '#6b7280' },
  { id: 'instagram', label: 'Instagram', color: '#ee2a7b' },
  { id: 'tiktok', label: 'TikTok', color: '#000000' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0077b5' },
  { id: 'twitter', label: 'X / Twitter', color: '#000000' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000' },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25d366' },
  { id: 'linktree', label: 'Linktree', color: '#39e09b' },
];

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: 'Text' },
  { id: 'wifi', label: 'WiFi' },
  { id: 'vcard', label: 'Contact' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'sms', label: 'SMS' },
];

/* ─── shared field styling ──────────────────────────────────────────── */
const inp =
  'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors';
const lbl = 'block mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500';

/* ─── content forms (module-level: stable identity keeps input focus) ── */
interface ContentFormProps {
  contentType: ContentType;
  urlValue: string;
  setUrlValue: (v: string) => void;
  textValue: string;
  setTextValue: (v: string) => void;
  wifiData: WifiInput;
  setWifiData: Dispatch<SetStateAction<WifiInput>>;
  vcardData: VCardInput;
  setVcardData: Dispatch<SetStateAction<VCardInput>>;
  emailData: EmailInput;
  setEmailData: Dispatch<SetStateAction<EmailInput>>;
  phoneValue: string;
  setPhoneValue: (v: string) => void;
  smsData: SmsInput;
  setSmsData: Dispatch<SetStateAction<SmsInput>>;
}

function ContentForm({
  contentType,
  urlValue,
  setUrlValue,
  textValue,
  setTextValue,
  wifiData,
  setWifiData,
  vcardData,
  setVcardData,
  emailData,
  setEmailData,
  phoneValue,
  setPhoneValue,
  smsData,
  setSmsData,
}: ContentFormProps) {
  switch (contentType) {
    case 'url':
      return (
        <div>
          <label className={lbl} htmlFor="qr-url">
            Website URL
          </label>
          <input
            id="qr-url"
            type="url"
            value={urlValue}
            onChange={(e) => {
              setUrlValue(e.target.value);
            }}
            placeholder="https://example.com"
            className={inp}
          />
        </div>
      );
    case 'text':
      return (
        <div>
          <label className={lbl} htmlFor="qr-text">
            Text
          </label>
          <textarea
            id="qr-text"
            value={textValue}
            onChange={(e) => {
              setTextValue(e.target.value);
            }}
            placeholder="Any text…"
            rows={4}
            className={`${inp} resize-none`}
          />
        </div>
      );
    case 'wifi':
      return (
        <div className="space-y-3">
          <div>
            <label className={lbl} htmlFor="qr-wifi-ssid">
              Network name (SSID)
            </label>
            <input
              id="qr-wifi-ssid"
              value={wifiData.ssid}
              onChange={(e) => {
                setWifiData((p) => ({ ...p, ssid: e.target.value }));
              }}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl} htmlFor="qr-wifi-password">
              Password
            </label>
            <input
              id="qr-wifi-password"
              type="password"
              value={wifiData.password}
              onChange={(e) => {
                setWifiData((p) => ({ ...p, password: e.target.value }));
              }}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl} htmlFor="qr-wifi-security">
              Security
            </label>
            <select
              id="qr-wifi-security"
              value={wifiData.security}
              onChange={(e) => {
                setWifiData((p) => ({
                  ...p,
                  security: e.target.value as 'WPA' | 'WEP' | 'nopass',
                }));
              }}
              className={inp}
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={wifiData.hidden}
              onChange={(e) => {
                setWifiData((p) => ({ ...p, hidden: e.target.checked }));
              }}
              className="rounded"
            />{' '}
            Hidden network
          </label>
        </div>
      );
    case 'vcard':
      return (
        <div className="space-y-3">
          {(
            [
              ['name', 'Full name', 'text'],
              ['phone', 'Phone', 'tel'],
              ['email', 'Email', 'email'],
              ['company', 'Company', 'text'],
              ['title', 'Job title', 'text'],
              ['website', 'Website', 'url'],
            ] as [keyof VCardInput, string, string][]
          ).map(([k, pl, t]) => (
            <div key={k}>
              <label className={lbl}>{pl}</label>
              <input
                type={t}
                value={vcardData[k]}
                onChange={(e) => {
                  setVcardData((p) => ({ ...p, [k]: e.target.value }));
                }}
                placeholder={pl}
                className={inp}
              />
            </div>
          ))}
        </div>
      );
    case 'email':
      return (
        <div className="space-y-3">
          <div>
            <label className={lbl} htmlFor="qr-email-to">
              To
            </label>
            <input
              id="qr-email-to"
              type="email"
              value={emailData.to}
              onChange={(e) => {
                setEmailData((p) => ({ ...p, to: e.target.value }));
              }}
              placeholder="recipient@example.com"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl} htmlFor="qr-email-subject">
              Subject
            </label>
            <input
              id="qr-email-subject"
              value={emailData.subject}
              onChange={(e) => {
                setEmailData((p) => ({ ...p, subject: e.target.value }));
              }}
              placeholder="Subject line"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl} htmlFor="qr-email-body">
              Body
            </label>
            <textarea
              id="qr-email-body"
              value={emailData.body}
              onChange={(e) => {
                setEmailData((p) => ({ ...p, body: e.target.value }));
              }}
              rows={3}
              className={`${inp} resize-none`}
            />
          </div>
        </div>
      );
    case 'phone':
      return (
        <div>
          <label className={lbl} htmlFor="qr-phone">
            Phone number
          </label>
          <input
            id="qr-phone"
            type="tel"
            value={phoneValue}
            onChange={(e) => {
              setPhoneValue(e.target.value);
            }}
            placeholder="+1 555 000 0000"
            className={inp}
          />
        </div>
      );
    case 'sms':
      return (
        <div className="space-y-3">
          <div>
            <label className={lbl} htmlFor="qr-sms-number">
              Phone number
            </label>
            <input
              id="qr-sms-number"
              type="tel"
              value={smsData.number}
              onChange={(e) => {
                setSmsData((p) => ({ ...p, number: e.target.value }));
              }}
              placeholder="+1 555 000 0000"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl} htmlFor="qr-sms-message">
              Message (optional)
            </label>
            <textarea
              id="qr-sms-message"
              value={smsData.message}
              onChange={(e) => {
                setSmsData((p) => ({ ...p, message: e.target.value }));
              }}
              rows={3}
              className={`${inp} resize-none`}
            />
          </div>
        </div>
      );
  }
}

/* ─── style tab content (module-level: stable identity keeps input focus) ── */
interface StylePanelProps {
  styleTab: 'qr' | 'frame' | 'social';
  setStyleTab: Dispatch<SetStateAction<'qr' | 'frame' | 'social'>>;
  dotStyle: DotStyle;
  setDotStyle: Dispatch<SetStateAction<DotStyle>>;
  cornerStyle: CornerStyle;
  setCornerStyle: Dispatch<SetStateAction<CornerStyle>>;
  fgColor: string;
  setFgColor: Dispatch<SetStateAction<string>>;
  bgColor: string;
  setBgColor: Dispatch<SetStateAction<string>>;
  ecl: 'L' | 'M' | 'Q' | 'H';
  setEcl: Dispatch<SetStateAction<'L' | 'M' | 'Q' | 'H'>>;
  logoUrl: string | undefined;
  setLogoUrl: Dispatch<SetStateAction<string | undefined>>;
  pickLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  frameTemplate: FrameTemplate;
  setFrameTemplate: Dispatch<SetStateAction<FrameTemplate>>;
  frameColor: string;
  setFrameColor: Dispatch<SetStateAction<string>>;
  frameText: string;
  setFrameText: Dispatch<SetStateAction<string>>;
  socialPreset: SocialPreset | null;
  setSocialPreset: Dispatch<SetStateAction<SocialPreset | null>>;
  socialHandle: string;
  setSocialHandle: Dispatch<SetStateAction<string>>;
}

function StylePanel({
  styleTab,
  setStyleTab,
  dotStyle,
  setDotStyle,
  cornerStyle,
  setCornerStyle,
  fgColor,
  setFgColor,
  bgColor,
  setBgColor,
  ecl,
  setEcl,
  logoUrl,
  setLogoUrl,
  pickLogo,
  frameTemplate,
  setFrameTemplate,
  frameColor,
  setFrameColor,
  frameText,
  setFrameText,
  socialPreset,
  setSocialPreset,
  socialHandle,
  setSocialHandle,
}: StylePanelProps) {
  const sectionTitle = 'mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400';
  const tabBtn = (id: typeof styleTab) =>
    [
      'flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all',
      styleTab === id
        ? 'bg-white text-neutral-900 shadow-sm'
        : 'text-neutral-500 hover:text-neutral-700',
    ].join(' ');

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl bg-neutral-100 p-1">
        {(['qr', 'frame', 'social'] as const).map((t) => (
          <button
            key={t}
            className={tabBtn(t)}
            onClick={() => {
              setStyleTab(t);
            }}
          >
            {t === 'qr' ? 'QR' : t === 'frame' ? 'Frame' : 'Social'}
          </button>
        ))}
      </div>

      {/* ── QR tab ── */}
      {styleTab === 'qr' && (
        <div className="space-y-6">
          <div>
            <p className={sectionTitle}>Dot style</p>
            <div className="grid grid-cols-3 gap-2">
              {DOT_STYLES.map(({ id, label, preview }) => (
                <button
                  key={id}
                  onClick={() => {
                    setDotStyle(id);
                  }}
                  title={label}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2 text-xl transition-all ${dotStyle === id ? 'border-brand-500 bg-brand-50' : 'border-neutral-200 hover:border-brand-200'}`}
                >
                  <span>{preview}</span>
                  <span className="text-[9px] font-medium text-neutral-500">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={sectionTitle}>Corner style</p>
            <div className="grid grid-cols-3 gap-2">
              {CORNER_STYLES.map(({ id, label, preview }) => (
                <button
                  key={id}
                  onClick={() => {
                    setCornerStyle(id);
                  }}
                  title={label}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2 text-xl transition-all ${cornerStyle === id ? 'border-brand-500 bg-brand-50' : 'border-neutral-200 hover:border-brand-200'}`}
                >
                  <span>{preview}</span>
                  <span className="text-[9px] font-medium text-neutral-500">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={sectionTitle}>Colors</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Dots (fg)', fgColor, setFgColor] as const,
                ['Background', bgColor, setBgColor] as const,
              ].map(([label, val, setter]) => (
                <div key={label}>
                  <p className="mb-1.5 text-xs text-neutral-500">{label}</p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 hover:border-brand-300">
                    <span
                      className="h-6 w-6 flex-shrink-0 rounded-lg border border-neutral-200 shadow-sm"
                      style={{ background: val }}
                    />
                    <span className="font-mono text-xs text-neutral-600">{val}</span>
                    <input
                      type="color"
                      value={val}
                      onChange={(e) => {
                        setter(e.target.value);
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className={sectionTitle}>Error correction</p>
            <div className="grid grid-cols-4 gap-2">
              {(['L', 'M', 'Q', 'H'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setEcl(l);
                  }}
                  className={`rounded-xl border-2 py-2 text-xs font-bold transition-all ${ecl === l ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-neutral-600 hover:border-brand-200'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-neutral-400">
              H = highest recovery (required for logos + shaped QR)
            </p>
          </div>

          <div>
            <p className={sectionTitle}>Logo (optional)</p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 py-4 text-sm text-neutral-500 hover:border-brand-300 hover:bg-white transition-all">
              {logoUrl ? (
                <span className="flex items-center gap-2">
                  <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
                  <span className="text-xs text-brand-600">Change logo</span>
                </span>
              ) : (
                <>Upload logo (PNG/SVG)</>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={pickLogo} />
            </label>
            {logoUrl && (
              <button
                onClick={() => {
                  setLogoUrl(undefined);
                }}
                className="mt-1 text-xs text-red-400 hover:underline"
              >
                Remove logo
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Frame tab ── */}
      {styleTab === 'frame' && (
        <div className="space-y-6">
          <div>
            <p className={sectionTitle}>Frame style</p>
            <div className="grid grid-cols-2 gap-2">
              {FRAME_TEMPLATES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setFrameTemplate(id);
                  }}
                  className={`rounded-xl border-2 px-3 py-2.5 text-left text-xs font-medium transition-all ${frameTemplate === id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-neutral-600 hover:border-brand-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!TEXTLESS_FRAMES.has(frameTemplate) && (
            <div>
              <p className={sectionTitle}>Label text</p>
              <input
                type="text"
                value={frameText}
                onChange={(e) => {
                  setFrameText(e.target.value.slice(0, 24));
                }}
                maxLength={24}
                placeholder="SCAN ME"
                className={inp}
              />
              <p className="mt-1.5 text-[10px] text-neutral-400">Max 24 characters</p>
            </div>
          )}

          {frameTemplate !== 'none' && (
            <div>
              <p className={sectionTitle}>Frame colour</p>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
                <span
                  className="h-7 w-7 rounded-lg border border-neutral-200 shadow-sm"
                  style={{ background: frameColor }}
                />
                <span className="font-mono text-xs text-neutral-600">{frameColor}</span>
                <input
                  type="color"
                  value={frameColor}
                  onChange={(e) => {
                    setFrameColor(e.target.value);
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* ── Social tab ── */}
      {styleTab === 'social' && (
        <div className="space-y-4">
          <div>
            <p className={sectionTitle}>Social platform</p>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_PLATFORMS.map(({ id, label, color }) => (
                <button
                  key={id ?? 'none'}
                  onClick={() => {
                    setSocialPreset(id);
                  }}
                  className={`rounded-xl border-2 px-3 py-2.5 text-left text-xs font-medium transition-all ${
                    socialPreset === id
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-neutral-200 text-neutral-600 hover:border-brand-200'
                  }`}
                  style={socialPreset === id ? { backgroundColor: color } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {socialPreset && (
            <div>
              <p className={sectionTitle}>Your handle</p>
              <div className="flex items-center">
                <span className="rounded-l-xl border border-r-0 border-neutral-200 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-500">
                  @
                </span>
                <input
                  type="text"
                  value={socialHandle}
                  onChange={(e) => {
                    setSocialHandle(e.target.value.slice(0, 30));
                  }}
                  maxLength={30}
                  placeholder="yourhandle"
                  className="min-w-0 flex-1 rounded-r-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-neutral-400">Shown on the card. Optional.</p>
            </div>
          )}

          {socialPreset && (
            <p className="rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-400">
              The QR code is styled as a branded{' '}
              {socialPreset.charAt(0).toUpperCase() + socialPreset.slice(1)} card. Frame settings
              are ignored while a social platform is selected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── component ─────────────────────────────────────────────────────── */
export function QrClient() {
  // Content
  const [contentType, setContentType] = useState<ContentType>('url');
  const [urlValue, setUrlValue] = useState('https://');
  const [textValue, setTextValue] = useState('');
  const [wifiData, setWifiData] = useState<WifiInput>({
    ssid: '',
    password: '',
    security: 'WPA',
    hidden: false,
  });
  const [vcardData, setVcardData] = useState<VCardInput>({
    name: '',
    phone: '',
    email: '',
    company: '',
    title: '',
    website: '',
  });
  const [emailData, setEmailData] = useState<EmailInput>({ to: '', subject: '', body: '' });
  const [phoneValue, setPhoneValue] = useState('');
  const [smsData, setSmsData] = useState<SmsInput>({ number: '', message: '' });

  // Style
  const [dotStyle, setDotStyle] = useState(DEF.dotStyle);
  const [cornerStyle, setCornerStyle] = useState(DEF.cornerStyle);
  const [fgColor, setFgColor] = useState(DEF.fgColor);
  const [bgColor, setBgColor] = useState(DEF.bgColor);
  const [ecl, setEcl] = useState<'L' | 'M' | 'Q' | 'H'>(DEF.ecl);
  const [frameTemplate, setFrameTemplate] = useState(DEF.frameTemplate);
  const [frameColor, setFrameColor] = useState(DEF.frameColor);
  const [frameText, setFrameText] = useState(DEF.frameText);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  // UI
  const [styleTab, setStyleTab] = useState<'qr' | 'frame' | 'social'>('qr');
  const [socialPreset, setSocialPreset] = useState<SocialPreset | null>(null);
  const [socialHandle, setSocialHandle] = useState('');
  const [copied, setCopied] = useState(false);

  const qrContainerRef = useRef<HTMLDivElement>(null);
  const renderTokenRef = useRef(0);

  /* ── derive formatted content string ─────────────────────────────── */
  const content = useMemo((): string => {
    switch (contentType) {
      case 'url':
        return urlValue;
      case 'text':
        return textValue;
      case 'wifi':
        return formatContent('wifi', wifiData);
      case 'vcard':
        return formatContent('vcard', vcardData);
      case 'email':
        return formatContent('email', emailData);
      case 'phone':
        return formatContent('phone', phoneValue);
      case 'sms':
        return formatContent('sms', smsData);
      default:
        return '';
    }
  }, [contentType, urlValue, textValue, wifiData, vcardData, emailData, phoneValue, smsData]);

  const hasContent = content.trim().length >= 2 && content !== 'https://';

  /* ── render whenever content or style changes ────────────────────── */
  useEffect(() => {
    const container = qrContainerRef.current;
    if (!container) return;
    if (!hasContent) {
      container.innerHTML = '';
      return;
    }
    const token = ++renderTokenRef.current;
    void renderFramedQr(
      container,
      {
        content,
        errorCorrectionLevel: ecl,
        size: 280,
        dotStyle,
        cornerStyle,
        fgColor,
        bgColor,
        frameTemplate,
        frameColor,
        frameText,
        logoUrl: logoUrl ?? null,
        socialPreset,
        socialHandle,
      },
      () => renderTokenRef.current !== token,
    );
  }, [
    content,
    hasContent,
    ecl,
    dotStyle,
    cornerStyle,
    fgColor,
    bgColor,
    frameTemplate,
    frameColor,
    frameText,
    logoUrl,
    socialPreset,
    socialHandle,
  ]);

  /* ── download / copy ─────────────────────────────────────────────── */
  const handleDownload = () => {
    if (!hasContent) return;
    void downloadQrCode(
      {
        content,
        errorCorrectionLevel: ecl,
        size: 800,
        dotStyle,
        cornerStyle,
        fgColor,
        bgColor,
        frameTemplate,
        frameColor,
        frameText,
        logoUrl: logoUrl ?? null,
        socialPreset,
        socialHandle,
      },
      'zipply-qr',
    );
  };

  const handleCopy = () => {
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) return;
    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    void (async () => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/svg+xml': blob })]);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      } catch {
        /* clipboard API may not be available */
      }
    })();
  };

  /* ── logo file pick ──────────────────────────────────────────────── */
  const pickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-0 flex-col gap-6 lg:flex-row">
      {/* ── Left: Content ── */}
      <div className="w-full space-y-5 lg:w-64 lg:flex-shrink-0">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Content type
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CONTENT_TYPES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  setContentType(id);
                }}
                className={`rounded-xl border-2 py-2 text-xs font-semibold transition-all ${contentType === id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-neutral-600 hover:border-brand-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Content
          </p>
          <ContentForm
            contentType={contentType}
            urlValue={urlValue}
            setUrlValue={setUrlValue}
            textValue={textValue}
            setTextValue={setTextValue}
            wifiData={wifiData}
            setWifiData={setWifiData}
            vcardData={vcardData}
            setVcardData={setVcardData}
            emailData={emailData}
            setEmailData={setEmailData}
            phoneValue={phoneValue}
            setPhoneValue={setPhoneValue}
            smsData={smsData}
            setSmsData={setSmsData}
          />
        </div>
      </div>

      {/* ── Center: Preview ── */}
      <div className="order-first flex flex-1 flex-col items-center gap-5 lg:order-none">
        <div
          className="relative flex w-full max-w-sm items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm"
          style={{ aspectRatio: '1/1' }}
        >
          {/* QR preview (hidden until content is entered) — the frame (if any)
              is baked directly into the rendered SVG, so this is just a
              bounding box that lets the SVG scale to fit its own aspect
              ratio (frame templates aren't all square). */}
          <div
            ref={qrContainerRef}
            className={`flex items-center justify-center transition-opacity duration-300 ${hasContent ? 'opacity-100' : 'opacity-0'}`}
            style={{ width: '86%', height: '86%' }}
          />

          {/* Placeholder */}
          {!hasContent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <svg viewBox="0 0 80 80" className="h-16 w-16 opacity-30" fill="currentColor">
                <rect x="5" y="5" width="28" height="28" rx="3" />
                <rect x="10" y="10" width="18" height="18" rx="1" fill="white" />
                <rect x="47" y="5" width="28" height="28" rx="3" />
                <rect x="52" y="10" width="18" height="18" rx="1" fill="white" />
                <rect x="5" y="47" width="28" height="28" rx="3" />
                <rect x="10" y="52" width="18" height="18" rx="1" fill="white" />
                <rect x="47" y="47" width="8" height="8" rx="1" />
                <rect x="59" y="47" width="16" height="8" rx="1" />
                <rect x="47" y="59" width="16" height="8" rx="1" />
                <rect x="67" y="59" width="8" height="16" rx="1" />
              </svg>
              <p className="text-sm">Enter content to generate</p>
            </div>
          )}
        </div>

        {/* Download buttons */}
        <div className="flex w-full max-w-sm flex-col gap-2">
          <button
            onClick={handleDownload}
            disabled={!hasContent}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M8 2v8M5 7l3 3 3-3" />
              <path d="M2 12h12" />
            </svg>
            Download PNG
          </button>
          <button
            onClick={handleCopy}
            disabled={!hasContent}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-2.5 text-sm font-medium text-neutral-700 transition-all hover:border-brand-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>

        {/* Info strip */}
        <p className="text-center text-xs text-neutral-400">
          QR codes are generated instantly and never stored · Free · No account needed
        </p>
      </div>

      {/* ── Right: Style ── */}
      <div className="w-full lg:w-72 lg:flex-shrink-0">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <StylePanel
            styleTab={styleTab}
            setStyleTab={setStyleTab}
            dotStyle={dotStyle}
            setDotStyle={setDotStyle}
            cornerStyle={cornerStyle}
            setCornerStyle={setCornerStyle}
            fgColor={fgColor}
            setFgColor={setFgColor}
            bgColor={bgColor}
            setBgColor={setBgColor}
            ecl={ecl}
            setEcl={setEcl}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            pickLogo={pickLogo}
            frameTemplate={frameTemplate}
            setFrameTemplate={setFrameTemplate}
            frameColor={frameColor}
            setFrameColor={setFrameColor}
            frameText={frameText}
            setFrameText={setFrameText}
            socialPreset={socialPreset}
            setSocialPreset={setSocialPreset}
            socialHandle={socialHandle}
            setSocialHandle={setSocialHandle}
          />
        </div>
      </div>
    </div>
  );
}
