/**
 * Campaign links: any number (up to MAX_LINKS) of http(s) URLs, each with an
 * optional label. The kind — YouTube, X, GitHub, … — is detected from the
 * host so the page can pick an icon and embed YouTube videos. Browser-safe.
 */

export const MAX_LINKS = 20;
const MAX_LABEL = 60;

export type LinkKind =
  | 'youtube'
  | 'x'
  | 'telegram'
  | 'discord'
  | 'github'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'twitch'
  | 'reddit'
  | 'medium'
  | 'substack'
  | 'spotify'
  | 'soundcloud'
  | 'vimeo'
  | 'rumble'
  | 'patreon'
  | 'kick'
  | 'linktree'
  | 'whatsapp'
  | 'snapchat'
  | 'pinterest'
  | 'threads'
  | 'bluesky'
  | 'farcaster'
  | 'gofundme'
  | 'email'
  | 'website';

export interface CampaignLink {
  url: string;
  label?: string;
}

const HOSTS: [RegExp, LinkKind, string][] = [
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube', 'YouTube'],
  [/(^|\.)(x\.com|twitter\.com)$/, 'x', 'X'],
  [/(^|\.)(t\.me|telegram\.me|telegram\.org)$/, 'telegram', 'Telegram'],
  [/(^|\.)(discord\.gg|discord\.com)$/, 'discord', 'Discord'],
  [/(^|\.)github\.com$/, 'github', 'GitHub'],
  [/(^|\.)instagram\.com$/, 'instagram', 'Instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok', 'TikTok'],
  [/(^|\.)(facebook\.com|fb\.com)$/, 'facebook', 'Facebook'],
  [/(^|\.)linkedin\.com$/, 'linkedin', 'LinkedIn'],
  [/(^|\.)twitch\.tv$/, 'twitch', 'Twitch'],
  [/(^|\.)(reddit\.com|redd\.it)$/, 'reddit', 'Reddit'],
  [/(^|\.)medium\.com$/, 'medium', 'Medium'],
  [/(^|\.)substack\.com$/, 'substack', 'Substack'],
  [/(^|\.)(spotify\.com|spotify\.link)$/, 'spotify', 'Spotify'],
  [/(^|\.)soundcloud\.com$/, 'soundcloud', 'SoundCloud'],
  [/(^|\.)vimeo\.com$/, 'vimeo', 'Vimeo'],
  [/(^|\.)rumble\.com$/, 'rumble', 'Rumble'],
  [/(^|\.)patreon\.com$/, 'patreon', 'Patreon'],
  [/(^|\.)kick\.com$/, 'kick', 'Kick'],
  [/(^|\.)(linktr\.ee|linktree\.com)$/, 'linktree', 'Linktree'],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, 'whatsapp', 'WhatsApp'],
  [/(^|\.)snapchat\.com$/, 'snapchat', 'Snapchat'],
  [/(^|\.)(pinterest\.com|pin\.it)$/, 'pinterest', 'Pinterest'],
  [/(^|\.)threads\.(net|com)$/, 'threads', 'Threads'],
  [/(^|\.)(bsky\.app|bsky\.social)$/, 'bluesky', 'Bluesky'],
  [/(^|\.)(warpcast\.com|farcaster\.xyz)$/, 'farcaster', 'Farcaster'],
  [/(^|\.)(gofundme\.com|gofund\.me)$/, 'gofundme', 'GoFundMe'],
];

export function linkKind(url: string): { kind: LinkKind; name: string } {
  try {
    const u = new URL(url);
    if (u.protocol === 'mailto:') return { kind: 'email', name: 'Email' };
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    for (const [re, kind, name] of HOSTS) if (re.test(host)) return { kind, name };
    return { kind: 'website', name: host };
  } catch {
    return { kind: 'website', name: 'Link' };
  }
}

/** YouTube video id from a watch/short/share/embed URL, else null. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host.endsWith('youtube.com')) {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
        id = m ? m[1] : null;
      }
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * Turn what people actually type into a full URL: "x.com/me" and
 * "www.site.org" get https:// added. Anything with an explicit scheme is left
 * alone (and validated by the caller). Returns null for non-URL text.
 */
export function coerceUrl(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?([/?#].*)?$/.test(text) || /^www\./i.test(text)) return `https://${text}`;
  return null;
}

/** Is this URL on another site than ours (or unparseable)? */
export function isExternalUrl(href: string, currentHost: string): boolean {
  try {
    const u = new URL(href, `https://${currentHost}`);
    return (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:') && u.host !== currentHost;
  } catch {
    return false;
  }
}

/**
 * Validate and clean user-supplied links (server side). Accepts http(s) and
 * mailto only — never javascript: or data: URLs. Adds https:// to bare
 * domains, drops blank rows, trims labels, and removes only *exact*
 * duplicates (same URL and same label). Returns an error message rather
 * than silently dropping anything the creator entered.
 */
export function normalizeLinks(input: unknown): { links: CampaignLink[] } | { error: string } {
  if (input == null) return { links: [] };
  if (!Array.isArray(input)) return { error: 'Links must be a list.' };

  const out: CampaignLink[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const urlText = typeof raw === 'string' ? raw : raw?.url;
    if (typeof urlText !== 'string' || !urlText.trim()) continue;

    let url: URL;
    try {
      url = new URL(coerceUrl(urlText) ?? '');
    } catch {
      return { error: `“${urlText.trim().slice(0, 60)}” doesn’t look like a link.` };
    }
    if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) {
      return { error: 'Links must start with https://, http:// or mailto:' };
    }
    const href = url.toString();
    if (href.length > 2048) return { error: 'One of the links is too long.' };

    const label = typeof raw?.label === 'string' ? raw.label.replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL) : '';
    // A normalised URL can't contain a space, so this key is unambiguous.
    const key = `${href} ${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label ? { url: href, label } : { url: href });
  }
  if (out.length > MAX_LINKS) return { error: `You can add up to ${MAX_LINKS} links.` };
  return { links: out };
}

/** Links for display: stored links plus the three legacy single-purpose fields. */
export function allLinks(doc: {
  links?: CampaignLink[];
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
}): CampaignLink[] {
  const list = [...(doc.links ?? [])];
  for (const legacy of [doc.demoVideoUrl, doc.whitepaperUrl, doc.githubUrl]) {
    if (legacy && !list.some((l) => l.url === legacy)) list.push({ url: legacy });
  }
  return list;
}
