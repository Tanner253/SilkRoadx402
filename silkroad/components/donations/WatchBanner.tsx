'use client';

/**
 * The reminder that follows a donor around the site: while a donation watch
 * is open it says what we're waiting for, and once it resolves it says
 * whether the gift was counted. Finished watches stay until acknowledged, so
 * the outcome is never missed.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, Clock, Loader2, RefreshCw, X } from 'lucide-react';
import { formatAmount, shortAddress } from '@/lib/format';
import { useWatches, type Watch } from './WatchProvider';
import { ShareGift } from './ShareGift';

function Row({ watch }: { watch: Watch }) {
  const { checkNow, dismiss, acknowledge } = useWatches();
  const [checking, setChecking] = useState(false);
  const pathname = usePathname();
  const onCampaign = pathname === `/fundraisers/${watch.fundraiserId}`;
  const total = watch.found.reduce((sum, d) => sum + d.amount, 0);
  const latestGift = [...watch.found].reverse().find((d) => d.giftId);
  const campaign = onCampaign ? (
    <strong className="font-medium">{watch.fundraiserTitle}</strong>
  ) : (
    <Link href={`/fundraisers/${watch.fundraiserId}`} className="font-medium underline underline-offset-2">
      {watch.fundraiserTitle}
    </Link>
  );

  if (watch.status === 'found') {
    return (
      <div className="flex items-start gap-3 bg-[#eef3e8] px-4 py-3 text-[13px] text-[#2d4028] sm:items-center">
        <CheckCircle2 size={17} className="mt-0.5 shrink-0 sm:mt-0" />
        <p className="flex-1">
          Thank you — your {formatAmount(total, 'ETH')} donation to {campaign} is verified and counted.
        </p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {latestGift?.giftId ? <ShareGift giftId={latestGift.giftId} amount={total} title={watch.fundraiserTitle} tone="dark" /> : null}
          <button type="button" onClick={() => acknowledge(watch.id)} className="rounded-md px-2 py-1 text-xs font-medium hover:bg-black/5">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (watch.status === 'expired') {
    return (
      <div className="flex items-start gap-3 bg-[#faf3e2] px-4 py-3 text-[13px] text-[#6b4f18] sm:items-center">
        <Clock size={17} className="mt-0.5 shrink-0 sm:mt-0" />
        <p className="flex-1">
          We didn&rsquo;t see a transfer from {shortAddress(watch.donor)} to {campaign} within 48 hours, so nothing was counted. Transfers sent from
          an exchange or a smart-contract wallet can&rsquo;t be matched.
        </p>
        <button type="button" onClick={() => dismiss(watch.id)} aria-label="Dismiss" className="shrink-0 rounded-md p-1 hover:bg-black/5">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 bg-[#2a3a25] px-4 py-3 text-[13px] text-[#f1f3ea] sm:items-center">
      <span className="relative mt-1 flex h-2 w-2 shrink-0 sm:mt-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b9d39f] opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b9d39f]" />
      </span>
      <p className="flex-1 leading-relaxed">
        {watch.status === 'needs_archive' ? 'Still looking for' : 'Watching for'} your donation to {campaign} from{' '}
        <span className="font-mono">{shortAddress(watch.donor)}</span>.{' '}
        <span className="text-[#c9d3bf]">
          It&rsquo;s only counted once we see it arrive from that wallet — send directly from it, not from an exchange.
          {watch.status === 'needs_archive' ? ' This one is taking longer to confirm; we’ll keep trying.' : ''}
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={async () => {
            setChecking(true);
            await checkNow();
            setChecking(false);
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-white/10"
        >
          {checking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Check
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Stop watching for this donation? If you’ve already sent it, it won’t be counted.')) dismiss(watch.id);
          }}
          aria-label="Stop watching"
          className="rounded-md p-1 hover:bg-white/10"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export function WatchBanner() {
  const { watches, acknowledged } = useWatches();
  const shown = watches.filter((w) => !acknowledged.has(w.id)).slice(0, 3);
  if (!shown.length) return null;

  return (
    <>
      {/* In-flow spacer: lets the page scroll clear of the fixed banner. */}
      <div aria-hidden="true" style={{ height: shown.length * 72 + 24 }} />
      <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-40 divide-y divide-white/10 overflow-hidden border-t border-black/10 shadow-[0_-8px_30px_#292d2518] sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[min(760px,calc(100%-32px))] sm:-translate-x-1/2 sm:rounded-xl sm:border"
    >
      {shown.map((w) => (
        <Row key={w.id} watch={w} />
      ))}
      </div>
    </>
  );
}
