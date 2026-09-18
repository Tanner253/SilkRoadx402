/**
 * Platform logos for campaign links. Brand marks come from Simple Icons
 * (CC0) — the real logos, including the current X mark. LinkedIn asked Simple
 * Icons to remove theirs, so it (and email/website) use lucide glyphs.
 */

import { Globe, Linkedin, Mail } from 'lucide-react';
import {
  siBluesky,
  siDiscord,
  siFacebook,
  siFarcaster,
  siGithub,
  siGofundme,
  siInstagram,
  siKick,
  siLinktree,
  siMedium,
  siPatreon,
  siPinterest,
  siReddit,
  siRumble,
  siSnapchat,
  siSoundcloud,
  siSpotify,
  siSubstack,
  siTelegram,
  siThreads,
  siTiktok,
  siTwitch,
  siVimeo,
  siWhatsapp,
  siX,
  siYoutube,
  type SimpleIcon,
} from 'simple-icons';
import type { LinkKind } from '@/lib/links';

const BRANDS: Partial<Record<LinkKind, SimpleIcon>> = {
  youtube: siYoutube,
  x: siX,
  telegram: siTelegram,
  discord: siDiscord,
  github: siGithub,
  instagram: siInstagram,
  tiktok: siTiktok,
  facebook: siFacebook,
  twitch: siTwitch,
  reddit: siReddit,
  medium: siMedium,
  substack: siSubstack,
  spotify: siSpotify,
  soundcloud: siSoundcloud,
  vimeo: siVimeo,
  rumble: siRumble,
  patreon: siPatreon,
  kick: siKick,
  linktree: siLinktree,
  whatsapp: siWhatsapp,
  snapchat: siSnapchat,
  pinterest: siPinterest,
  threads: siThreads,
  bluesky: siBluesky,
  farcaster: siFarcaster,
  gofundme: siGofundme,
};

/** Brand colours too pale to read on the cream background get darkened. */
const READABLE: Partial<Record<LinkKind, string>> = { snapchat: '#C9A800', kick: '#2E8F0E', linktree: '#2A9C45' };

export function BrandIcon({ kind, size = 16, color = true }: { kind: LinkKind; size?: number; color?: boolean }) {
  const brand = BRANDS[kind];
  if (brand) {
    return (
      <svg
        role="img"
        aria-hidden="true"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color ? READABLE[kind] ?? `#${brand.hex}` : 'currentColor'}
        className="shrink-0"
      >
        <path d={brand.path} />
      </svg>
    );
  }
  const Glyph = kind === 'linkedin' ? Linkedin : kind === 'email' ? Mail : Globe;
  return <Glyph size={size} className="shrink-0" color={color && kind === 'linkedin' ? '#0A66C2' : 'currentColor'} aria-hidden="true" />;
}
