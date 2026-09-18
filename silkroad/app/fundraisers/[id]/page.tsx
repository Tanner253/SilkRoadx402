'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Flag, Loader2 } from 'lucide-react';
import type { CommentView, DonationView, FundraiserView } from '@/types/fundraiser';
import { goalOf } from '@/types/fundraiser';
import { donationExplorerUrl, explorerAddressUrl } from '@/lib/chain/network';
import { formatAmount, percentRaised, shortAddress, timeAgo } from '@/lib/format';
import { getManageToken, saveManaged, takeManageTokenFromUrl } from '@/lib/manageLinks';
import { DonatePanel } from '@/components/fundraisers/DonatePanel';
import { ManagePanel } from '@/components/fundraisers/ManagePanel';
import { CopyButton, CoverImage, Notice, Pill, ProgressBar, inputClass, primaryButtonClass } from '@/components/fundraisers/ui';
import { CampaignLinks } from '@/components/fundraisers/links';
import { useWatches } from '@/components/donations/WatchProvider';
import { PiggyBank } from '@/components/mascot/PiggyBank';
import { errorMessage } from '@/lib/errors';

export default function FundraiserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [fundraiser, setFundraiser] = useState<FundraiserView | null>(null);
  const [donations, setDonations] = useState<DonationView[]>([]);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [pageUrl, setPageUrl] = useState('');

  const load = useCallback(async () => {
    // A manage link carries its token in the fragment; move it into storage.
    const fromUrl = takeManageTokenFromUrl();
    const manageToken = fromUrl ?? getManageToken(id);
    setToken(manageToken);
    setPageUrl(`${window.location.origin}/fundraisers/${id}`);

    try {
      const res = await fetch(`/api/fundraisers/${id}`, {
        headers: manageToken ? { 'x-manage-token': manageToken } : undefined,
        cache: 'no-store',
      });
      if (res.status === 404) return setStatus('missing');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFundraiser(data.fundraiser);
      setCanManage(!!data.canManage);
      if (fromUrl && data.canManage) saveManaged(id, fromUrl, data.fundraiser.title);
      setStatus('ready');
    } catch {
      setStatus('error');
    }

    const [tx, cm] = await Promise.all([
      fetch(`/api/fundraisers/${id}/transactions`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      fetch(`/api/fundraisers/${id}/comments`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    ]);
    setDonations(tx?.transactions ?? []);
    setComments(cm?.comments ?? []);
  }, [id]);

  useEffect(() => {
    load();
    fetch(`/api/fundraisers/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id, load]);

  // When this browser's watch finds a donation, refresh totals and the log.
  const { watches } = useWatches();
  const foundHere = watches.filter((w) => w.fundraiserId === id).reduce((n, w) => n + w.found.length, 0);
  useEffect(() => {
    if (foundHere) load();
  }, [foundHere, load]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }
  if (status !== 'ready' || !fundraiser) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-24 pt-10 text-center">
        <PiggyBank pose="sleep" size={200} />
        <h1 className="mb-2 mt-4 text-2xl font-medium text-foreground">
          {status === 'missing' ? 'This campaign doesn’t exist.' : 'Couldn’t load this campaign.'}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {status === 'missing' ? 'It may have been deleted by its creator.' : 'Please try again in a moment.'}
        </p>
        <Link href="/fundraisers" className={primaryButtonClass}>
          Browse campaigns
        </Link>
      </div>
    );
  }

  const f = fundraiser;
  const goal = goalOf(f);
  const pct = percentRaised(f.raisedAmount, goal);

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-24 md:px-8">
      <Link href="/fundraisers" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={15} /> All campaigns
      </Link>

      {canManage && token ? (
        <div className="mb-8">
          <ManagePanel key={`${f.state}:${f.updatedAt ?? ''}`} fundraiser={f} token={token} onChanged={load} />
        </div>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-14 lg:gap-y-0">
        <article className="min-w-0 lg:col-start-1 lg:row-start-1">
          <CoverImage src={f.imageUrl} alt={f.title} priority className="mb-8 aspect-[16/9] w-full rounded-2xl" />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Pill>{f.category}</Pill>
            {f.state === 'pulled' ? <Pill className="bg-[#faf3e2] text-[#7a5a1c]">Paused</Pill> : null}
            <span className="text-xs text-muted-foreground">Started {timeAgo(f.createdAt)}</span>
          </div>
          <h1 className="mb-6 text-[clamp(30px,4vw,46px)] font-[450] leading-[1.08] tracking-[-0.035em] text-foreground">{f.title}</h1>
          <p className="whitespace-pre-wrap text-[15px] leading-[1.9] text-muted-foreground">{f.description}</p>

          <CampaignLinks links={f.links ?? []} />
        </article>

        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_#292d2508]">
            <p className="text-3xl font-medium tracking-[-0.02em] text-foreground">{formatAmount(f.raisedAmount, f.currency)}</p>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">raised of {formatAmount(goal, f.currency)} goal</p>
            <ProgressBar percent={pct} className="mb-3" />
            <div className="mb-6 flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(pct)}% funded</span>
              <span>
                {f.donationCount ?? donations.length} donation{(f.donationCount ?? donations.length) === 1 ? '' : 's'}
              </span>
            </div>

            <DonatePanel fundraiser={f} />
          </div>

          <div className="mt-4 space-y-3 px-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Share this campaign</span>
              <CopyButton value={pageUrl} label="Copy link" />
            </div>
            {f.network === 'robinhood' ? (
              <p>
                Receiving address on the explorer:{' '}
                <a href={explorerAddressUrl(f.wallet)} target="_blank" rel="noopener noreferrer" className="font-mono text-primary underline-offset-2 hover:underline">
                  {shortAddress(f.wallet)}
                </a>
              </p>
            ) : null}
            <Report campaignId={id} />
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <section className="lg:mt-14" aria-labelledby="donations-title">
            <h2 id="donations-title" className="mb-4 text-lg font-medium text-foreground">
              Donations <span className="text-muted-foreground">· {donations.length}</span>
            </h2>
            {donations.length ? (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {donations.map((d) => (
                  <li key={d._id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{formatAmount(d.amount, d.currency)}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">from {shortAddress(d.wallet)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">{timeAgo(d.createdAt)}</p>
                      <a href={donationExplorerUrl(d.txnHash, d.network)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-xs text-primary underline-offset-2 hover:underline">
                        Transaction <ArrowUpRight size={11} />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
                No donations yet. Be the first — every little bit counts.
              </p>
            )}
          </section>

          <Comments campaignId={id} comments={comments} onPosted={load} />
        </div>

      </div>
    </div>
  );
}

function Comments({ campaignId, comments, onPosted }: { campaignId: string; comments: CommentView[]; onPosted: () => void }) {
  const { watches } = useWatches();
  const donor = watches.find((w) => w.fundraiserId === campaignId && w.status === 'found')?.donor ?? null;
  const alreadyCommented = !!donor && comments.some((c) => c.buyerWallet.toLowerCase() === donor.toLowerCase());
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="mt-14" aria-labelledby="comments-title">
      <h2 id="comments-title" className="mb-4 text-lg font-medium text-foreground">
        Words of support <span className="text-muted-foreground">· {comments.length}</span>
      </h2>

      {donor && !alreadyCommented ? (
        <form
          className="mb-6 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              const res = await fetch(`/api/fundraisers/${campaignId}/comments`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ comment: text }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.error || 'Couldn’t post your comment');
              setText('');
              onPosted();
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="comment" className="mb-2 block text-sm font-medium text-foreground">
            Thanks for giving — leave a note?
          </label>
          <textarea id="comment" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} className={`${inputClass} resize-y`} placeholder="Rooting for you!" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Posting as <span className="font-mono">{shortAddress(donor)}</span> · {text.trim().length}/500
            </span>
            <button type="submit" disabled={busy || text.trim().length < 2} className={primaryButtonClass}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : null} Post
            </button>
          </div>
          {error ? (
            <Notice tone="error" className="mt-3">
              {error}
            </Notice>
          ) : null}
        </form>
      ) : null}

      {comments.length ? (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c._id} className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="mb-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{c.comment}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {shortAddress(c.buyerWallet)} · {timeAgo(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Donors can leave a note here once their gift is counted.</p>
      )}
    </section>
  );
}

function Report({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (state === 'sent') return <p className="text-[#3d5136]">Thanks — our admins will review this campaign.</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 hover:text-foreground">
        <Flag size={12} /> Report this campaign
      </button>
    );
  }
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setState('sending');
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ listingId: campaignId, reason }),
        }).catch(() => null);
        const data = await res?.json().catch(() => ({}));
        if (res?.ok) setState('sent');
        else {
          setState('error');
          setMessage(data?.error || 'Couldn’t send the report.');
        }
      }}
    >
      <label htmlFor="report-reason" className="block">
        What&rsquo;s wrong with this campaign?
      </label>
      <textarea id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={100} rows={2} className={`${inputClass} text-xs`} />
      <div className="flex gap-2">
        <button type="submit" disabled={state === 'sending'} className="rounded-md bg-[#9b3b2c] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
          Send report
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-2 text-xs hover:text-foreground">
          Cancel
        </button>
      </div>
      {state === 'error' ? <p className="text-[#9b3b2c]">{message}</p> : null}
    </form>
  );
}
