/**
 * /gift/[id] — the public page behind a shared donation. Crawlers read its
 * metadata and card image (opengraph-image.tsx); people who click through
 * see the gift and are one tap from giving to the same campaign.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { getGift } from '@/lib/gifts';
import { formatAmount, percentRaised, shortAddress, timeAgo } from '@/lib/format';
import { ProgressBar, primaryButtonClass, secondaryButtonClass } from '@/components/fundraisers/ui';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gift = await getGift(id).catch(() => null);
  if (!gift) return { title: 'Gift', robots: { index: false } };
  const title = `${formatAmount(gift.amount)} to ${gift.fundraiser.title}`;
  const description = `${shortAddress(gift.donor)} gave ${formatAmount(gift.amount)} to “${gift.fundraiser.title}” — verified on-chain. No KYC, no wallet connection: chip in too.`;
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { type: 'website', title, description, url: `/gift/${id}` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function GiftPage({ params }: Props) {
  const { id } = await params;
  const gift = await getGift(id).catch(() => null);
  if (!gift) notFound();
  const f = gift.fundraiser;
  const pct = percentRaised(f.raised, f.goal);

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 md:px-8">
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        <CheckCircle2 size={14} /> Verified on-chain gift
      </p>
      <h1 className="mb-8 text-[clamp(30px,5vw,48px)] font-[450] leading-[1.1] tracking-[-0.035em] text-foreground">
        <span className="font-mono text-[0.55em] tracking-normal text-muted-foreground">{shortAddress(gift.donor)}</span>
        <br />
        gave <span className="text-primary">{formatAmount(gift.amount)}</span> to {f.title}.
      </h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/gift/${id}/opengraph-image`}
        alt={`${formatAmount(gift.amount)} to ${f.title}`}
        width={1200}
        height={630}
        className="mb-8 w-full rounded-2xl border border-border"
      />

      <div className="mb-8 rounded-2xl border border-border bg-card p-5">
        <ProgressBar percent={pct} className="mb-2.5" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{formatAmount(f.raised)}</span>
          {f.goal ? ` raised of ${formatAmount(f.goal)}` : ' raised'} · gift made {timeAgo(gift.at)}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/fundraisers/${f.id}`} className={primaryButtonClass}>
          Give to this campaign <ArrowUpRight size={16} />
        </Link>
        <Link href="/fundraisers/new" className={secondaryButtonClass}>
          Start your own
        </Link>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        OpenFund: no KYC, no wallet connection. Donations go straight from the donor&rsquo;s wallet to the cause on Robinhood Chain, and every
        one is checked on-chain before it counts.
      </p>
    </div>
  );
}
