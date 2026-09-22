/**
 * The "I gave" share card: a 1200×630 image shown when someone shares their
 * gift on X, Telegram, iMessage… Built with next/og (flexbox-only JSX).
 * Everything on it is real: a verified on-chain donation and its campaign.
 */

import { ImageResponse } from 'next/og';
import { PIG_AVATAR_DATA_URI } from '@/lib/brand/pigAvatar';
import { formatAmount, shortAddress } from '@/lib/format';

export const GIFT_CARD_SIZE = { width: 1200, height: 630 };

export interface GiftCardData {
  donor: string;
  amount: number;
  title: string;
  raised: number;
  goal: number;
  /** Campaign cover as a data URI (see loadCover), or null for no image. */
  cover: string | null;
}

const C = {
  cream: '#f5f3ec',
  card: '#fbfaf6',
  forest: '#2f4229',
  sage: '#62754d',
  ink: '#23261f',
  muted: '#6f7266',
  line: '#e3e5da',
  lime: '#c9f07a',
};

type Font = { name: string; data: ArrayBuffer; weight: 500 | 700 | 800; style: 'normal' };
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&family=JetBrains+Mono:wght@500';
let fonts: Promise<Font[]> | null = null;

/**
 * Inter (500/700/800) and JetBrains Mono from Google Fonts, fetched once per
 * server instance. If they can't be loaded the card still renders in the
 * built-in font — just without bold weights.
 */
function loadFonts(): Promise<Font[]> {
  fonts ??= (async () => {
    const css = await fetch(FONT_CSS, { signal: AbortSignal.timeout(5000) }).then((r) => r.text());
    const faces = [...css.matchAll(/font-family: '([^']+)';[^}]*?font-weight: (\d+);[^}]*?src: url\((https:[^)]+\.ttf)\)/g)];
    return Promise.all(
      faces.map(async ([, name, weight, url]) => ({
        name,
        weight: Number(weight) as Font['weight'],
        style: 'normal' as const,
        data: await fetch(url, { signal: AbortSignal.timeout(5000) }).then((r) => r.arrayBuffer()),
      })),
    );
  })().catch((error) => {
    console.warn('Gift card fonts unavailable:', error?.message ?? error);
    fonts = null; // try again next time
    return [];
  });
  return fonts;
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/**
 * Fetch a campaign cover as a square JPEG data URI. The image renderer only
 * understands PNG/JPEG, and a slow or broken cover must never break the card,
 * so this asks Cloudinary/Unsplash for a JPEG crop and gives up quietly.
 */
export async function loadCover(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  let src = url;
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) src = src.replace('/upload/', '/upload/f_jpg,c_fill,g_auto,w_840,h_840,q_80/');
  else if (src.includes('images.unsplash.com')) src = `${src.split('?')[0]}?w=840&h=840&fit=crop&fm=jpg&q=80`;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(5000), headers: { accept: 'image/jpeg,image/png' } });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/image\/(jpeg|png)/.test(type)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 4 * 1024 * 1024) return null;
    return `data:${type.split(';')[0]};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function giftCardImage(d: GiftCardData): Promise<ImageResponse> {
  const loaded = await loadFonts();
  const pct = d.goal > 0 ? Math.min(100, (d.raised / d.goal) * 100) : 0;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: C.cream, padding: 56, fontFamily: 'Inter' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            background: C.card,
            border: `2px solid ${C.line}`,
            borderRadius: 36,
            padding: '44px 52px',
          }}
        >
          {/* Header: brand + verified stamp */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PIG_AVATAR_DATA_URI} width={52} height={52} style={{ borderRadius: 26 }} alt="" />
              <span style={{ fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: -0.5 }}>OpenFund</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: C.forest,
                color: C.lime,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2,
                padding: '10px 18px',
                borderRadius: 999,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="10" fill={C.lime} />
                <path d="M5.5 10.3l3 3 6-6.3" stroke={C.forest} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              VERIFIED ON-CHAIN
            </div>
          </div>

          {/* Body: the gift, and the campaign it went to */}
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 44, marginTop: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, color: C.muted, fontFamily: 'JetBrains Mono' }}>{shortAddress(d.donor)} gave</span>
              <span style={{ fontSize: 104, fontWeight: 800, color: C.forest, letterSpacing: -4, lineHeight: 1.05 }}>{formatAmount(d.amount)}</span>
              <span style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>to</span>
              <span style={{ fontSize: 40, fontWeight: 600, color: C.ink, lineHeight: 1.2, letterSpacing: -0.8 }}>{clip(d.title, 64)}</span>
            </div>
            {d.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.cover} width={280} height={280} style={{ borderRadius: 28, objectFit: 'cover' }} alt="" />
            ) : null}
          </div>

          {/* Footer: campaign progress + where to give */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {d.goal > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', width: '100%', height: 12, background: '#e6e8dc', borderRadius: 999 }}>
                  <div style={{ display: 'flex', width: `${Math.max(pct, 2)}%`, height: 12, background: C.sage, borderRadius: 999 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: C.muted }}>
                  <span>
                    {formatAmount(d.raised)} raised of {formatAmount(d.goal)}
                  </span>
                  <span style={{ color: C.forest, fontWeight: 700 }}>openfund.fun</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 20, color: C.forest, fontWeight: 700 }}>openfund.fun</div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...GIFT_CARD_SIZE, fonts: loaded.length ? loaded : undefined },
  );
}
