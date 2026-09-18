'use client';

/**
 * Campaign links — an editor for the create/edit forms and the display for
 * the campaign page. Any number of links (up to MAX_LINKS); the platform is
 * detected from the URL and shown with its logo, and YouTube plays inline.
 * External clicks go through the site-wide leaving-OpenFund confirmation.
 */

import { ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import { MAX_LINKS, coerceUrl, linkKind, youtubeId, type CampaignLink } from '@/lib/links';
import { BrandIcon } from './BrandIcon';
import { inputClass, secondaryButtonClass } from './ui';

/** The URL as it will be saved, or null if it isn't a usable link. */
function resolved(url: string): string | null {
  const coerced = coerceUrl(url);
  if (!coerced) return null;
  try {
    const u = new URL(coerced);
    return ['https:', 'http:', 'mailto:'].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

export function LinksEditor({ value, onChange }: { value: CampaignLink[]; onChange: (links: CampaignLink[]) => void }) {
  const rows = value.length ? value : [{ url: '' }];
  const update = (i: number, patch: Partial<CampaignLink>) => onChange(rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      {rows.map((link, i) => {
        const href = resolved(link.url);
        const invalid = link.url.trim() !== '' && !href;
        const detected = href ? linkKind(href) : null;
        return (
          <div key={i}>
            <div className="flex gap-2">
              <span
                className="flex h-[42px] w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground"
                title={detected?.name}
                aria-hidden="true"
              >
                <BrandIcon kind={detected?.kind ?? 'website'} color={!!detected} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                <input
                  aria-label={`Link ${i + 1} URL`}
                  aria-invalid={invalid}
                  value={link.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder="youtube.com/…, x.com/…, your website"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${inputClass} min-w-0 sm:flex-[2] ${invalid ? 'border-[#e8c4bd]' : ''}`}
                />
                <input
                  aria-label={`Link ${i + 1} label`}
                  value={link.label ?? ''}
                  maxLength={60}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder={detected ? `Label (default: ${detected.name})` : 'Label (optional)'}
                  className={`${inputClass} min-w-0 sm:flex-1`}
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                aria-label={`Remove link ${i + 1}`}
                className="flex h-[42px] w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Trash2 size={15} />
              </button>
            </div>
            {invalid ? <p className="ml-12 mt-1 text-xs text-[#9b3b2c]">That doesn&rsquo;t look like a link.</p> : null}
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

/** Rows ready for the API: empty rows dropped; bare domains get https://. */
export const cleanLinks = (links: CampaignLink[]) =>
  links
    .map((l) => ({ url: resolved(l.url) ?? l.url.trim(), label: l.label?.trim() || undefined }))
    .filter((l) => l.url);

/** True if any row has text that isn't a usable link. */
export const hasInvalidLinks = (links: CampaignLink[]) => links.some((l) => l.url.trim() !== '' && !resolved(l.url));

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
        {links.map((link, i) => {
          const { kind, name } = linkKind(link.url);
          return (
            <a
              key={`${link.url}-${i}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              data-user-link=""
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <BrandIcon kind={kind} size={15} />
              <span className="truncate">{link.label || name}</span>
              <ArrowUpRight size={13} className="shrink-0 text-muted-foreground" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
