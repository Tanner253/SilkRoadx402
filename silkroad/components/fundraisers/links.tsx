'use client';

/**
 * Campaign links — an editor for the create/edit forms and the display for
 * the campaign page. Any number of links (up to MAX_LINKS); the kind is
 * detected from the URL, and YouTube videos play inline.
 */

import {
  ArrowUpRight,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Music2,
  Plus,
  Send,
  Trash2,
  Twitch,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { MAX_LINKS, linkKind, youtubeId, type CampaignLink, type LinkKind } from '@/lib/links';
import { inputClass, secondaryButtonClass } from './ui';

const ICONS: Record<LinkKind, LucideIcon> = {
  youtube: Youtube,
  x: Twitter,
  telegram: Send,
  discord: MessageCircle,
  github: Github,
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
  linkedin: Linkedin,
  twitch: Twitch,
  email: Mail,
  website: Globe,
};

export function LinksEditor({ value, onChange }: { value: CampaignLink[]; onChange: (links: CampaignLink[]) => void }) {
  const rows = value.length ? value : [{ url: '' }];
  const update = (i: number, patch: Partial<CampaignLink>) => onChange(rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-2.5">
      {rows.map((link, i) => {
        const { kind } = linkKind(link.url);
        const Icon = link.url ? ICONS[kind] : Globe;
        return (
          <div key={i} className="flex gap-2">
            <span className="flex h-[42px] w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground" aria-hidden="true">
              <Icon size={16} />
            </span>
            <input
              aria-label={`Link ${i + 1} URL`}
              type="url"
              value={link.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder="https://youtube.com/…, https://x.com/…, your website"
              className={`${inputClass} min-w-0 flex-[2]`}
            />
            <input
              aria-label={`Link ${i + 1} label`}
              value={link.label ?? ''}
              maxLength={60}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Label (optional)"
              className={`${inputClass} hidden min-w-0 flex-1 sm:block`}
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              aria-label={`Remove link ${i + 1}`}
              className="flex h-[42px] w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
      {rows.length < MAX_LINKS ? (
        <button type="button" onClick={() => onChange([...rows, { url: '' }])} className={secondaryButtonClass}>
          <Plus size={14} /> Add a link
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">That&rsquo;s the maximum of {MAX_LINKS} links.</p>
      )}
    </div>
  );
}

/** Drop empty rows before sending to the API. */
export const cleanLinks = (links: CampaignLink[]) =>
  links
    .map((l) => ({ url: l.url.trim(), label: l.label?.trim() || undefined }))
    .filter((l) => l.url);

export function CampaignLinks({ links }: { links: CampaignLink[] }) {
  if (!links.length) return null;
  const video = links.map((l) => youtubeId(l.url)).find(Boolean);

  return (
    <div className="mt-8 space-y-5">
      {video ? (
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video}`}
            title="Campaign video"
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const { kind, name } = linkKind(link.url);
          const Icon = ICONS[kind];
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{link.label || name}</span>
              <ArrowUpRight size={13} className="shrink-0 text-muted-foreground" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
