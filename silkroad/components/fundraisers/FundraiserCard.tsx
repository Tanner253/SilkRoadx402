'use client';

import Link from 'next/link';
import { Pin } from 'lucide-react';
import type { FundraiserView } from '@/types/fundraiser';
import { goalOf } from '@/types/fundraiser';
import { formatAmount, goalNudge, percentRaised } from '@/lib/format';
import { CoverImage, Pill, ProgressBar } from './ui';

export function FundraiserCard({ fundraiser: f }: { fundraiser: FundraiserView }) {
  const goal = goalOf(f);
  const pct = percentRaised(f.raisedAmount, goal);
  const legacy = f.network !== 'robinhood';
  const nudge = legacy ? null : goalNudge(f.raisedAmount, goal, f.currency);

  return (
    <Link
      href={`/fundraisers/${f._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_#292d2508] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_#292d2514]"
    >
      <CoverImage src={f.imageUrl} alt={f.title} className="aspect-[16/10] w-full" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <Pill>{f.category}</Pill>
          {f.pinned ? (
            <Pill className="bg-[#f3ead5] text-[#7a5a1c]">
              <Pin size={11} /> Featured
            </Pill>
          ) : null}
          {legacy ? <Pill className="bg-muted text-muted-foreground">Solana · closed</Pill> : null}
        </div>
        <h3 className="mb-2 line-clamp-2 text-lg font-medium leading-snug tracking-[-0.01em] text-foreground">{f.title}</h3>
        <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>

        <div className="mt-auto">
          <ProgressBar percent={pct} className="mb-2.5" />
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">{formatAmount(f.raisedAmount, f.currency)}</span>
            <span className="text-xs text-muted-foreground">
              of {formatAmount(goal, f.currency)} · {Math.round(pct)}%
            </span>
          </div>
          {nudge ? <p className="mt-2 text-xs font-medium text-[#7a5a1c]">{nudge}</p> : null}
        </div>
      </div>
    </Link>
  );
}
