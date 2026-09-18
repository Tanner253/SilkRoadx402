'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import type { FundraiserView } from '@/types/fundraiser';
import { goalOf } from '@/types/fundraiser';
import { formatAmount, percentRaised } from '@/lib/format';
import { allManaged, forgetManaged, parseManageLink, saveManaged } from '@/lib/manageLinks';
import { CoverImage, Notice, PageIntro, Pill, ProgressBar, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/fundraisers/ui';
import { errorMessage } from '@/lib/errors';

/**
 * There are no accounts: "my" campaigns are the ones whose manage links this
 * browser holds. On a new device, paste a manage link to add it here.
 */
export default function MyFundraisersPage() {
  const [campaigns, setCampaigns] = useState<FundraiserView[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const managed = allManaged();
    const ids = Object.keys(managed);
    if (!ids.length) return setCampaigns([]);
    try {
      const res = await fetch(`/api/fundraisers?ids=${ids.join(',')}`, { cache: 'no-store' });
      const data = await res.json();
      const found: FundraiserView[] = data.fundraisers ?? [];
      setCampaigns(found);
      setMissing(ids.filter((id) => !found.some((f) => f._id === id)));
    } catch {
      setCampaigns([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkError(null);
    const parsed = parseManageLink(link);
    if (!parsed) return setLinkError('That doesn’t look like a manage link. It ends in #manage=… .');
    setAdding(true);
    try {
      const res = await fetch(`/api/fundraisers/${parsed.id}`, { headers: { 'x-manage-token': parsed.token }, cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Campaign not found');
      if (!data.canManage) throw new Error('That manage link isn’t valid for this campaign.');
      saveManaged(parsed.id, parsed.token, data.fundraiser.title);
      setLink('');
      load();
    } catch (err) {
      setLinkError(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-[960px] px-6 pb-24 md:px-8">
      <PageIntro eyebrow="MY FUNDRAISERS" title="Your" accent="campaigns.">
        Campaigns you started in this browser. On another device, paste your manage link below to bring one over.
      </PageIntro>

      {campaigns === null ? (
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
      ) : campaigns.length ? (
        <ul className="space-y-4">
          {campaigns.map((f) => {
            const goal = goalOf(f);
            const pct = percentRaised(f.raisedAmount, goal);
            return (
              <li key={f._id}>
                <Link href={`/fundraisers/${f._id}`} className="flex gap-5 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[0_12px_32px_#292d2512]">
                  <CoverImage src={f.imageUrl} alt={f.title} className="hidden h-24 w-36 shrink-0 rounded-xl sm:block" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-medium text-foreground">{f.title}</h2>
                      {f.state === 'pulled' ? <Pill className="bg-[#faf3e2] text-[#7a5a1c]">Paused</Pill> : <Pill>Live</Pill>}
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {formatAmount(f.raisedAmount, f.currency)} of {formatAmount(goal, f.currency)} · {f.donationCount ?? 0} donation
                      {f.donationCount === 1 ? '' : 's'}
                    </p>
                    <ProgressBar percent={pct} />
                  </div>
                  <ArrowUpRight size={18} className="shrink-0 self-center text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="mb-1 text-lg font-medium text-foreground">No campaigns in this browser yet.</p>
          <p className="mb-6 text-sm text-muted-foreground">Start one, or paste a manage link below.</p>
          <Link href="/fundraisers/new" className={primaryButtonClass}>
            <Plus size={16} /> Start a fundraiser
          </Link>
        </div>
      )}

      {missing.length ? (
        <Notice className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span>
            {missing.length} saved campaign{missing.length === 1 ? ' no longer exists' : 's no longer exist'}.
          </span>
          <button
            type="button"
            className="text-xs font-medium underline"
            onClick={() => {
              missing.forEach(forgetManaged);
              setMissing([]);
            }}
          >
            Forget {missing.length === 1 ? 'it' : 'them'}
          </button>
        </Notice>
      ) : null}

      <form onSubmit={addLink} className="mt-12 rounded-2xl border border-border bg-card p-5">
        <label htmlFor="manage-link" className="mb-2 block text-sm font-medium text-foreground">
          Add a campaign with its manage link
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="manage-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…/fundraisers/…#manage=…" className={`${inputClass} font-mono text-[12.5px]`} />
          <button type="submit" disabled={adding || !link.trim()} className={secondaryButtonClass}>
            Add
          </button>
        </div>
        {linkError ? <p className="mt-2 text-xs text-[#9b3b2c]">{linkError}</p> : null}
      </form>
    </div>
  );
}
