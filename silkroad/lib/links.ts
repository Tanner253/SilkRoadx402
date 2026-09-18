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
 * Validate and clean user-supplied links (server side). Accepts http(s) and
 * mailto only — never javascript: or data: URLs. Drops blanks, removes
 * duplicates, trims labels. Returns an error message instead of throwing.
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
      url = new URL(urlText.trim());
    } catch {
      return { error: `“${urlText.trim().slice(0, 60)}” isn’t a full link — include https://` };
    }
    if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) {
      return { error: 'Links must start with https://, http:// or mailto:' };
    }
    const href = url.toString();
    if (href.length > 2048) return { error: 'One of the links is too long.' };
    if (seen.has(href)) continue;
    seen.add(href);

    const label = typeof raw?.label === 'string' ? raw.label.replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL) : '';
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
