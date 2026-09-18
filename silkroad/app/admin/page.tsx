'use client';

/**
 * Moderation. There is no approval queue — campaigns go live on creation —
 * so this is only for acting on reports: remove, restore, pin.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Flag, Loader2, LogOut, Pin } from 'lucide-react';
import type { FundraiserView } from '@/types/fundraiser';
import { goalOf } from '@/types/fundraiser';
import { formatAmount, shortAddress, timeAgo } from '@/lib/format';
import { Notice, PageIntro, Pill, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/fundraisers/ui';
import { errorMessage } from '@/lib/errors';

type AdminFundraiser = FundraiserView & { approved: boolean; reports: number };
type Filter = 'reported' | 'live' | 'removed' | 'all';

export default function AdminPage() {
  const [session, setSession] = useState<{ admin: boolean; configured: boolean } | null>(null);
  const [code, setCode] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminFundraiser[] | null>(null);
  const [filter, setFilter] = useState<Filter>('reported');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openReports, setOpenReports] = useState<string | null>(null);
  const [reports, setReports] = useState<{ _id: string; reason?: string; createdAt: string }[]>([]);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/fundraisers', { cache: 'no-store' });
    if (res.status === 401) return setSession((s) => (s ? { ...s, admin: false } : s));
    const data = await res.json();
    setRows(data.fundraisers ?? []);
  }, []);

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => {
        setSession(s);
        if (s.admin) load();
      });
  }, [load]);

  const visible = useMemo(() => {
    const list = rows ?? [];
    if (filter === 'reported') return list.filter((f) => f.reports > 0).sort((a, b) => b.reports - a.reports);
    if (filter === 'live') return list.filter((f) => f.state !== 'pulled');
    if (filter === 'removed') return list.filter((f) => f.state === 'pulled');
    return list;
  }, [rows, filter]);

  async function act(id: string, action: 'remove' | 'restore' | 'pin' | 'unpin') {
    setBusy(id + action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/fundraisers/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Action failed');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (!session.admin) {
    return (
      <div className="mx-auto max-w-sm px-6 pb-24">
        <PageIntro eyebrow="ADMIN" title="Moderation" />
        {!session.configured ? (
          <Notice tone="warning">Admin login is disabled until ADMIN_CODE and JWT_SECRET are set.</Notice>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoginError(null);
              const res = await fetch('/api/admin/session', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ code }),
              });
              if (res.ok) {
                setSession({ admin: true, configured: true });
                setCode('');
                load();
              } else setLoginError((await res.json().catch(() => ({}))).error || 'Login failed');
            }}
          >
            <label htmlFor="code" className="block text-sm font-medium text-foreground">
              Admin code
            </label>
            <input id="code" type="password" autoComplete="current-password" value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} />
            <button type="submit" disabled={!code} className={`${primaryButtonClass} w-full`}>
              Log in
            </button>
            {loginError ? <Notice tone="error">{loginError}</Notice> : null}
          </form>
        )}
      </div>
    );
  }

  const counts = {
    reported: rows?.filter((f) => f.reports > 0).length ?? 0,
    live: rows?.filter((f) => f.state !== 'pulled').length ?? 0,
    removed: rows?.filter((f) => f.state === 'pulled').length ?? 0,
    all: rows?.length ?? 0,
  };

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-24 md:px-8">
      <div className="flex items-start justify-between gap-4">
        <PageIntro eyebrow="ADMIN" title="Moderation">
          Campaigns go live without review. Act on reports here: removing a campaign hides it and stops donations, and its creator can&rsquo;t undo it.
        </PageIntro>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={async () => {
            await fetch('/api/admin/session', { method: 'DELETE' });
            setSession({ admin: false, configured: true });
            setRows(null);
          }}
        >
          <LogOut size={14} /> Log out
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {(['reported', 'live', 'removed', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors ${
              filter === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-accent'
            }`}
          >
            {f} · {counts[f]}
          </button>
        ))}
      </div>

      {error ? <Notice tone="error" className="mb-4">{error}</Notice> : null}

      {rows === null ? (
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {visible.map((f) => (
            <li key={f._id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Link href={`/fundraisers/${f._id}`} target="_blank" className="font-medium text-foreground hover:underline">
                      {f.title}
                    </Link>
                    <ArrowUpRight size={13} className="text-muted-foreground" />
                    {f.state === 'pulled' ? (
                      <Pill className="bg-[#fbeeeb] text-[#9b3b2c]">{f.approved === false ? 'Removed' : 'Paused by creator'}</Pill>
                    ) : (
                      <Pill>Live</Pill>
                    )}
                    {f.pinned ? <Pill className="bg-[#f3ead5] text-[#7a5a1c]">Pinned</Pill> : null}
                    {f.network !== 'robinhood' ? <Pill className="bg-muted text-muted-foreground">Solana (legacy)</Pill> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatAmount(f.raisedAmount, f.currency)} of {formatAmount(goalOf(f), f.currency)} · {f.donationCount} donation{f.donationCount === 1 ? '' : 's'} ·{' '}
                    <span className="font-mono">{shortAddress(f.wallet)}</span> · created {timeAgo(f.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {f.reports > 0 ? (
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={async () => {
                        if (openReports === f._id) return setOpenReports(null);
                        const data = await fetch(`/api/admin/reports?fundraiserId=${f._id}`, { cache: 'no-store' }).then((r) => r.json());
                        setReports(data.reports ?? []);
                        setOpenReports(f._id);
                      }}
                    >
                      <Flag size={14} /> {f.reports} report{f.reports === 1 ? '' : 's'}
                    </button>
                  ) : null}
                  <button type="button" disabled={busy === f._id + (f.pinned ? 'unpin' : 'pin')} onClick={() => act(f._id, f.pinned ? 'unpin' : 'pin')} className={secondaryButtonClass}>
                    <Pin size={14} /> {f.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  {f.state === 'pulled' && f.approved === false ? (
                    <button type="button" disabled={!!busy} onClick={() => act(f._id, 'restore')} className={secondaryButtonClass}>
                      Restore
                    </button>
                  ) : f.state !== 'pulled' ? (
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => window.confirm(`Remove “${f.title}”? It will be hidden and stop taking donations.`) && act(f._id, 'remove')}
                      className="inline-flex items-center rounded-md bg-[#9b3b2c] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              {openReports === f._id ? (
                <ul className="mt-3 space-y-1.5 rounded-lg bg-background p-3 text-xs text-muted-foreground">
                  {reports.map((r) => (
                    <li key={r._id}>
                      <span className="text-foreground">{r.reason || 'No reason given'}</span> · {timeAgo(r.createdAt)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
