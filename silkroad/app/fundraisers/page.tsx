'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
import { FUNDRAISER_CATEGORIES } from '@/config/constants';
import { goalOf, type FundraiserView } from '@/types/fundraiser';
import { percentRaised } from '@/lib/format';
import { FundraiserCard } from '@/components/fundraisers/FundraiserCard';
import { Notice, PageIntro, inputClass, primaryButtonClass } from '@/components/fundraisers/ui';
import { Reveal } from '@/components/motion/Reveal';
import { errorMessage } from '@/lib/errors';

const time = (value: string | null | undefined) => (value ? new Date(value).getTime() : 0);
const progress = (f: FundraiserView) => percentRaised(f.raisedAmount, goalOf(f));
const pinnedFirst = (a: FundraiserView, b: FundraiserView) => Number(!!b.pinned) - Number(!!a.pinned);

/**
 * Trending: campaigns people are giving to right now rise to the top —
 * most gifts in the last 24 hours, then the most recent gift, then newest.
 */
const SORTS = {
  trending: {
    label: 'Trending',
    compare: (a: FundraiserView, b: FundraiserView) =>
      pinnedFirst(a, b) ||
      (b.giftsToday ?? 0) - (a.giftsToday ?? 0) ||
      time(b.lastGiftAt) - time(a.lastGiftAt) ||
      time(b.createdAt) - time(a.createdAt),
  },
  newest: { label: 'Newest', compare: (a: FundraiserView, b: FundraiserView) => time(b.createdAt) - time(a.createdAt) },
  raised: { label: 'Most raised', compare: (a: FundraiserView, b: FundraiserView) => (b.raisedAmount ?? 0) - (a.raisedAmount ?? 0) },
  close: {
    label: 'Almost funded',
    // Closest to the goal first; campaigns already past it go last.
    compare: (a: FundraiserView, b: FundraiserView) => {
      const pa = progress(a) >= 100 ? -1 : progress(a);
      const pb = progress(b) >= 100 ? -1 : progress(b);
      return pb - pa;
    },
  },
} as const;
type SortKey = keyof typeof SORTS;

function CampaignsContent() {
  const searchParams = useSearchParams();
  const [fundraisers, setFundraisers] = useState<FundraiserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('All');
  const [query, setQuery] = useState(searchParams.get('wallet') ?? '');
  const [sort, setSort] = useState<SortKey>('trending');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/fundraisers')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load campaigns');
        if (!cancelled) setFundraisers(data.fundraisers ?? []);
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Only show categories that actually have campaigns, in the canonical order.
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of fundraisers) map.set(f.category, (map.get(f.category) ?? 0) + 1);
    return map;
  }, [fundraisers]);
  const categories = ['All', ...FUNDRAISER_CATEGORIES.filter((c) => counts.has(c))];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = fundraisers.filter(
      (f) =>
        (category === 'All' || f.category === category) &&
        (!q || f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.wallet.toLowerCase().includes(q)),
    );
    return [...matches].sort(SORTS[sort].compare);
  }, [fundraisers, category, query, sort]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-24 md:px-8">
      <PageIntro eyebrow="CAMPAIGNS" title="Find a cause" accent="worth backing.">
        Every campaign here goes straight to its creator&rsquo;s wallet. No sign-up needed to give.
      </PageIntro>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Categories">
          {categories.map((c) => {
            const active = c === category;
            const count = c === 'All' ? fundraisers.length : counts.get(c) ?? 0;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(c)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-accent'
                }`}
              >
                {c}
                <span
                  className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                    active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <label className="relative min-w-0 flex-1 md:w-64 md:flex-none">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search campaigns</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or address"
              className={`${inputClass} pl-9`}
            />
          </label>
          <label className="shrink-0">
            <span className="sr-only">Sort campaigns</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${inputClass} w-auto pr-8`}>
              {(Object.keys(SORTS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORTS[key].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <Notice tone="error">Couldn&rsquo;t load campaigns: {error}</Notice>
      ) : loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[380px] animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : visible.length ? (
        <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05} y={18}>
          {visible.map((f) => (
            <FundraiserCard key={f._id} fundraiser={f} />
          ))}
        </Reveal>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="mb-1 text-lg font-medium text-foreground">
            {fundraisers.length ? 'No campaigns match that.' : 'No campaigns yet.'}
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            {fundraisers.length ? 'Try another category or search.' : 'Be the first to start one.'}
          </p>
          <Link href="/fundraisers/new" className={primaryButtonClass}>
            Start a fundraiser <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function FundraisersPage() {
  return (
    <Suspense fallback={null}>
      <CampaignsContent />
    </Suspense>
  );
}
