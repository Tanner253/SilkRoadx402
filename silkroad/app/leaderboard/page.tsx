'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatAmount, shortAddress, type Currency } from '@/lib/format';
import { Notice, PageIntro, primaryButtonClass } from '@/components/fundraisers/ui';
import { errorMessage } from '@/lib/errors';

interface Row {
  wallet: string;
  totalRaised: number;
  donationCount: number;
  activeCampaigns: number;
  currency: Currency;
}

function Table({ rows }: { rows: Row[] }) {
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {rows.map((r, i) => (
        <li key={r.wallet} className="flex items-center gap-4 px-5 py-4">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums ${
              i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <Link href={`/fundraisers?wallet=${r.wallet}`} className="font-mono text-sm text-foreground underline-offset-2 hover:underline">
              {shortAddress(r.wallet, 8, 6)}
            </Link>
            <p className="text-xs text-muted-foreground">
              {r.donationCount} donation{r.donationCount === 1 ? '' : 's'} · {r.activeCampaigns} active campaign{r.activeCampaigns === 1 ? '' : 's'}
            </p>
          </div>
          <span className="shrink-0 text-right text-sm font-medium tabular-nums text-foreground">{formatAmount(r.totalRaised, r.currency)}</span>
        </li>
      ))}
    </ol>
  );
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [legacy, setLegacy] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leaderboard?limit=25', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setRows(data.leaderboard ?? []);
        setLegacy(data.legacy ?? []);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <div className="mx-auto max-w-[860px] px-6 pb-24 md:px-8">
      <PageIntro eyebrow="TOP FUNDRAISERS" title="The most" accent="backed.">
        Creators ranked by verified donations to their campaigns on Robinhood Chain.
      </PageIntro>

      {error ? (
        <Notice tone="error">Couldn&rsquo;t load the leaderboard: {error}</Notice>
      ) : rows === null ? (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      ) : rows.length ? (
        <Table rows={rows} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="mb-1 text-lg font-medium text-foreground">No donations on Robinhood Chain yet.</p>
          <p className="mb-6 text-sm text-muted-foreground">The first campaign to raise lands at the top.</p>
          <Link href="/fundraisers/new" className={primaryButtonClass}>
            Start a fundraiser <ArrowUpRight size={16} />
          </Link>
        </div>
      )}

      {legacy.length ? (
        <details className="mt-12">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            Before the move — Solana, USDC ({legacy.length})
          </summary>
          <p className="mb-4 mt-3 text-xs text-muted-foreground">Ranked separately: USDC and ETH aren&rsquo;t added together.</p>
          <Table rows={legacy} />
        </details>
      ) : null}
    </div>
  );
}
