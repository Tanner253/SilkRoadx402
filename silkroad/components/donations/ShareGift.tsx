'use client';

/**
 * "Share your gift" — posts a verified donation to X with its share page,
 * whose preview card shows the gift. Giving is contagious: a friend's post is
 * the strongest nudge there is, and the link lands right on the campaign.
 */

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

const X_URL = process.env.NEXT_PUBLIC_X_COMMUNITY_URL || 'https://x.com/OpenFundPons';
/** @handle to tag, when the configured X link is a profile (not a community). */
const X_HANDLE = X_URL.match(/^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?$/)?.[1] ?? null;

export function giftUrl(giftId: string) {
  return `${window.location.origin}/gift/${giftId}`;
}

export function shareText(amount: number, title: string) {
  const on = X_HANDLE ? `@${X_HANDLE}` : 'OpenFund';
  return `I just gave ${formatAmount(amount)} to “${title}” on ${on} 🐷\n\nNo KYC, no wallet connecting — straight to the cause, verified on-chain. Chip in 👇`;
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2Zm-1.1 18.2h1.7L6.3 3.7H4.5l13.3 16.5Z" />
    </svg>
  );
}

export function ShareGift({
  giftId,
  amount,
  title,
  tone = 'light',
  className,
}: {
  giftId: string;
  amount: number;
  title: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const post = () => {
    const intent = new URL('https://x.com/intent/tweet');
    intent.searchParams.set('text', shareText(amount, title));
    intent.searchParams.set('url', giftUrl(giftId));
    window.open(intent.toString(), '_blank', 'noopener,noreferrer,width=600,height=640');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(giftUrl(giftId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const secondary =
    tone === 'dark' ? 'text-current hover:bg-black/5' : 'border border-border bg-card text-foreground hover:bg-accent';
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={post}
        className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black"
      >
        <XLogo /> Share your gift
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Link copied' : 'Copy share link'}
        title={copied ? 'Copied' : 'Copy share link'}
        className={cn('inline-flex items-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors', secondary)}
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
      </button>
    </div>
  );
}
