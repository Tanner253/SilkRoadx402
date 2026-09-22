'use client';

/**
 * "Share your gift" — like a PnL card for giving. Opens the donor's gift card
 * (a PNG of what they gave, to whom, verified on-chain) with Copy image and
 * Download, plus a button that opens an X post with the text and campaign
 * link ready. The donor attaches the card themselves, so it shows up no matter
 * how X previews links.
 */

import { useState } from 'react';
import { Check, Copy, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

const X_URL = process.env.NEXT_PUBLIC_X_COMMUNITY_URL || 'https://x.com/OpenFundPons';
/** @handle to tag, when the configured X link is a profile (not a community). */
const X_HANDLE = X_URL.match(/^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?$/)?.[1] ?? null;

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

const button =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function ShareGift({
  giftId,
  fundraiserId,
  amount,
  title,
  className,
}: {
  giftId: string;
  fundraiserId: string;
  amount: number;
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState<'image' | 'text' | null>(null);
  const [copyError, setCopyError] = useState(false);

  const imageUrl = `/gift/${giftId}/opengraph-image`;
  const text = shareText(amount, title);
  const flash = (what: 'image' | 'text') => {
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1800);
  };

  async function copyImage() {
    setCopyError(false);
    try {
      // Passing the fetch promise (not the blob) keeps Safari's user-gesture check happy.
      const blob = fetch(imageUrl).then((r) => r.blob()).then((b) => new Blob([b], { type: 'image/png' }));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      flash('image');
    } catch {
      setCopyError(true);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(`${text}\n${window.location.origin}/fundraisers/${fundraiserId}`);
      flash('text');
    } catch {
      /* clipboard unavailable */
    }
  }

  function postOnX() {
    const intent = new URL('https://x.com/intent/tweet');
    intent.searchParams.set('text', text);
    intent.searchParams.set('url', `${window.location.origin}/fundraisers/${fundraiserId}`);
    window.open(intent.toString(), '_blank', 'noopener,noreferrer,width=600,height=640');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('inline-flex items-center gap-1.5 rounded-md bg-[#111] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black', className)}
      >
        <XLogo /> Share your gift
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border-border bg-card p-6">
          <DialogTitle className="text-xl font-medium tracking-tight text-foreground">Your gift card</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Copy or download it, then attach it to your post. Everything on it is verified on-chain.
          </DialogDescription>

          <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-xl border border-border bg-background">
            {!loaded && !failed ? (
              <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Making your card…
              </span>
            ) : null}
            {failed ? (
              <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Couldn&rsquo;t make your card right now — try again in a moment.
              </span>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open ? imageUrl : undefined}
              alt={`${formatAmount(amount)} to ${title}`}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={cn('h-full w-full object-cover transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={copyImage} disabled={!loaded} className={cn(button, 'border border-border bg-background text-foreground hover:bg-accent')}>
              {copied === 'image' ? <Check size={15} /> : <Copy size={15} />} {copied === 'image' ? 'Copied' : 'Copy image'}
            </button>
            <a
              href={imageUrl}
              download={`openfund-gift-${giftId}.png`}
              data-no-leave-warning=""
              aria-disabled={!loaded}
              onClick={(e) => !loaded && e.preventDefault()}
              className={cn(button, 'border border-border bg-background text-foreground hover:bg-accent', !loaded && 'pointer-events-none opacity-50')}
            >
              <Download size={15} /> Download
            </a>
            <button type="button" onClick={postOnX} className={cn(button, 'bg-[#111] text-white hover:bg-black')}>
              <XLogo /> Post on X
            </button>
          </div>
          {copyError ? (
            <p className="text-xs text-[#9b3b2c]">Your browser won&rsquo;t copy images — use Download instead, or right-click the card and copy it.</p>
          ) : null}

          <div className="rounded-lg border border-border bg-background p-3">
            <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{text}</p>
            <button type="button" onClick={copyText} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              {copied === 'text' ? <Check size={13} /> : <Copy size={13} />} {copied === 'text' ? 'Copied' : 'Copy text + link'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
