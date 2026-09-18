'use client';

/**
 * Small shared pieces for the fundraiser pages, so headings, progress,
 * copy buttons and notices look the same everywhere.
 */

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Eyebrow + headline (+ optional serif accent) + lede, like the homepage. */
export function PageIntro({
  eyebrow,
  title,
  accent,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  accent?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-10', className)}>
      {eyebrow ? (
        <p className="mb-5 flex items-center gap-2.5 text-[10px] font-semibold tracking-[1.5px] text-[#59684a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#62754d]" /> {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[clamp(38px,5vw,62px)] font-[450] leading-[1.02] tracking-[-0.045em] text-foreground">
        {title}
        {accent ? (
          <>
            {' '}
            <em className="font-serif font-normal italic text-[#59684a]" style={{ fontFamily: 'Georgia, serif' }}>
              {accent}
            </em>
          </>
        ) : null}
      </h1>
      {children ? <div className="mt-5 max-w-xl text-[15px] leading-[1.85] text-muted-foreground">{children}</div> : null}
    </header>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#e6e8dc]', className)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(percent, percent > 0 ? 2 : 0)}%` }}
      />
    </div>
  );
}

export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked — the value is on screen to copy by hand */
        }
      }}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent',
        className,
      )}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

type Tone = 'neutral' | 'success' | 'warning' | 'error';
const tones: Record<Tone, string> = {
  neutral: 'border-border bg-card text-muted-foreground',
  success: 'border-[#c5d3b8] bg-[#eef3e8] text-[#3d5136]',
  warning: 'border-[#e6d3a8] bg-[#faf3e2] text-[#7a5a1c]',
  error: 'border-[#e8c4bd] bg-[#fbeeeb] text-[#9b3b2c]',
};

export function Notice({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border px-4 py-3 text-sm leading-relaxed', tones[tone], className)}>{children}</div>;
}

/** Pill for network / status labels. */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-[#eceee4] px-2.5 py-1 text-[11px] font-medium text-[#3d5136]', className)}>
      {children}
    </span>
  );
}

export const inputClass =
  'w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#293d23] disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50';

const OPTIMIZABLE_HOSTS = /(^|\.)cloudinary\.com$|^images\.unsplash\.com$/;

/**
 * Campaign cover. Uses next/image for hosts allowed in next.config.ts, and a
 * plain <img> otherwise — next/image throws on unlisted hosts, which would
 * take the whole page down for one odd legacy URL.
 */
export function CoverImage({ src, alt, className, priority }: { src?: string; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  let host = '';
  try {
    host = src ? new URL(src).hostname : '';
  } catch {
    /* not a URL — falls through to the placeholder */
  }

  if (!src || !host || failed) {
    return <div className={cn('flex items-center justify-center bg-[#eceee4] text-xs text-muted-foreground', className)} aria-label={alt}>No image</div>;
  }
  if (OPTIMIZABLE_HOSTS.test(host)) {
    return (
      <div className={cn('relative overflow-hidden bg-[#eceee4]', className)}>
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" priority={priority} onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className={cn('relative overflow-hidden bg-[#eceee4]', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading={priority ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
    </div>
  );
}
