'use client';

/**
 * Site-wide ticker of the latest real donations, like a trading-floor tape.
 * Social proof that people are giving right now — every entry is a verified
 * on-chain donation shown with its true age, never padded with fake ones.
 * The bar keeps its height while loading or empty, so the page never jumps.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatAmount, shortAddress, shortAgo } from '@/lib/format';

interface Donation {
  donor: string;
  amount: number;
  at: string;
  fundraiserId: string;
  fundraiserTitle: string;
}

const REFRESH_MS = 30_000;
/** Repeat the real entries until the tape is long enough to scroll smoothly. */
const MIN_TAPE = 8;

function Entry({ d }: { d: Donation }) {
  return (
    <Link
      href={`/fundraisers/${d.fundraiserId}`}
      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 text-[12px] text-[#dfe5d3] transition-colors hover:text-white"
    >
      <span className="font-mono text-[11px] text-[#aebb9a]">{shortAddress(d.donor)}</span>
      <span className="font-mono font-semibold text-[#c9f07a]">▲ {formatAmount(d.amount)}</span>
      <span className="text-[#aebb9a]">→</span>
      <span className="max-w-[22ch] truncate">{d.fundraiserTitle}</span>
      <span className="font-mono text-[11px] text-[#8f9c7c]">{shortAgo(d.at)}</span>
      <span className="pl-2 text-[#5f6d52]" aria-hidden="true">•</span>
    </Link>
  );
}

export function DonationTicker() {
  const [donations, setDonations] = useState<Donation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (document.visibilityState !== 'visible') return;
      fetch('/api/donations/recent')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => !cancelled && data?.donations && setDonations(data.donations))
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  let tape: Donation[] = [];
  if (donations?.length) while (tape.length < MIN_TAPE) tape = tape.concat(donations);

  return (
    <section aria-label="Latest donations" className="flex h-8 items-center overflow-hidden border-b border-black/20 bg-[#2c3a27]">
      <span className="z-10 flex h-full shrink-0 items-center gap-2 bg-[#23301f] px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c9f07a] sm:px-4">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c9f07a] opacity-70 motion-reduce:hidden" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#c9f07a]" />
        </span>
        Live gifts
      </span>
      <div className="of-marquee-mask min-w-0 flex-1 overflow-hidden">
        {tape.length ? (
          <div className="of-marquee flex w-max" style={{ ['--of-marquee-duration' as string]: `${tape.length * 5}s` }}>
            {[0, 1].map((copy) => (
              <div key={copy} className="flex" aria-hidden={copy === 1 || undefined}>
                {tape.map((d, i) => (
                  <Entry key={`${copy}-${i}`} d={d} />
                ))}
              </div>
            ))}
          </div>
        ) : donations ? (
          <p className="truncate px-4 text-[12px] text-[#aebb9a]">Every gift shows up here the moment it&rsquo;s verified on-chain — be the first.</p>
        ) : null}
      </div>
    </section>
  );
}
