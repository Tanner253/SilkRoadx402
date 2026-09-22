'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { formatAmount, shortAddress, timeAgo, type Currency } from '@/lib/format';
import { explorerAddressUrl } from '@/lib/chain/network';
import { Notice, PageIntro, primaryButtonClass } from '@/components/fundraisers/ui';
import { useWatches } from '@/components/donations/WatchProvider';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

interface FundraiserRow {
  wallet: string;
  totalRaised: number;
  donationCount: number;
  activeCampaigns: number;
  currency: Currency;
}

interface DonorRow {
  wallet: string;
  totalGiven: number;
  donationCount: number;
  campaignCount: number;
  lastAt: string;
}

type Tab = 'donors' | 'fundraisers';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function Rank({ i }: { i: number }) {
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums',
        i === 0 ? 'bg-primary text-primary-foreground' : i < 3 ? 'bg-[#e6e8dc] text-foreground' : 'bg-muted text-muted-foreground',
      )}
    >
      {i + 1}
    </span>
  );
}

function FundraiserTable({ rows }: { rows: FundraiserRow[] }) {
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {rows.map((r, i) => (
        <li key={r.wallet} className="flex items-center gap-4 px-5 py-4">
          <Rank i={i} />
          <div className="min-w-0 flex-1">
            <Link href={`/fundraisers?wallet=${r.wallet}`} className="font-mono text-sm text-foreground underline-offset-2 hover:underline">
              {shortAddress(r.wallet, 8, 6)}
            </Link>
            <p className="text-xs text-muted-foreground">
              {plural(r.donationCount, 'donation')} · {plural(r.activeCampaigns, 'active campaign')}
            </p>
          </div>
          <span className="shrink-0 text-right text-sm font-medium tabular-nums text-foreground">{formatAmount(r.totalRaised, r.currency)}</span>
        </li>
      ))}
    </ol>
  );
}

function DonorTable({ rows, mine }: { rows: DonorRow[]; mine: Set<string> }) {
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {rows.map((r, i) => {
        const you = mine.has(r.wallet.toLowerCase());
        return (
          <li key={r.wallet} className={cn('flex items-center gap-4 px-5 py-4', you && 'bg-[#f3f5ec]')}>
            <Rank i={i} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <a
                  href={explorerAddressUrl(r.wallet)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-foreground underline-offset-2 hover:underline"
                >
                  {shortAddress(r.wallet, 8, 6)}
                </a>
                {you ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">You</span> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {plural(r.donationCount, 'gift')} to {plural(r.campaignCount, 'campaign')} · last {timeAgo(r.lastAt)}
              </p>
            </div>
            <span className="shrink-0 text-right text-sm font-medium tabular-nums text-foreground">{formatAmount(r.totalGiven)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <p className="mb-1 text-lg font-medium text-foreground">{title}</p>
      <p className="mb-6 text-sm text-muted-foreground">{body}</p>
      <Link href="/fundraisers" className={primaryButtonClass}>
        Find a campaign <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}

function Leaderboard() {
  const router = useRouter();
  const params = useSearchParams();
  const tab: Tab = params.get('tab') === 'fundraisers' ? 'fundraisers' : 'donors';
  const { watches } = useWatches();
  const mine = useMemo(() => new Set(watches.map((w) => w.donor.toLowerCase())), [watches]);

  const [fundraisers, setFundraisers] = useState<FundraiserRow[] | null>(null);
  const [donors, setDonors] = useState<DonorRow[] | null>(null);
  const [legacy, setLegacy] = useState<FundraiserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leaderboard?limit=25', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setFundraisers(data.leaderboard ?? []);
        setDonors(data.donors ?? []);
        setLegacy(data.legacy ?? []);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const rows = tab === 'donors' ? donors : fundraisers;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'donors', label: 'Top donors' },
    { id: 'fundraisers', label: 'Top fundraisers' },
  ];

  return (
    <div className="mx-auto max-w-[860px] px-6 pb-24 md:px-8">
      {tab === 'donors' ? (
        <PageIntro eyebrow="LEADERBOARD" title="The most" accent="generous.">
          Wallets ranked by verified ETH they&rsquo;ve given to campaigns on Robinhood Chain. Every gift is checked on-chain — give to climb.
        </PageIntro>
      ) : (
        <PageIntro eyebrow="LEADERBOARD" title="The most" accent="backed.">
          Creators ranked by verified donations to their campaigns on Robinhood Chain.
        </PageIntro>
      )}

      <div className="mb-6 inline-flex rounded-full border border-border bg-card p-1" role="tablist" aria-label="Leaderboard">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => router.replace(t.id === 'donors' ? '/leaderboard' : `/leaderboard?tab=${t.id}`, { scroll: false })}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <Notice tone="error">Couldn&rsquo;t load the leaderboard: {error}</Notice>
      ) : rows === null ? (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      ) : tab === 'donors' ? (
        donors?.length ? (
          <DonorTable rows={donors} mine={mine} />
        ) : (
          <Empty title="No donors yet." body="The first gift puts you at number one." />
        )
      ) : fundraisers?.length ? (
        <FundraiserTable rows={fundraisers} />
      ) : (
        <Empty title="No donations on Robinhood Chain yet." body="The first campaign to raise lands at the top." />
      )}

      {tab === 'fundraisers' && legacy.length ? (
        <details className="mt-12">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            Before the move — Solana, USDC ({legacy.length})
          </summary>
          <p className="mb-4 mt-3 text-xs text-muted-foreground">Ranked separately: USDC and ETH aren&rsquo;t added together.</p>
          <FundraiserTable rows={legacy} />
        </details>
      ) : null}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-64 max-w-[860px] px-6 md:px-8" />}>
      <Leaderboard />
    </Suspense>
  );
}
