'use client';

/**
 * Creator controls, shown when this browser holds the campaign's manage
 * token and the server confirmed it (GET …?canManage). Every request sends
 * the token in the x-manage-token header; the server re-checks it each time.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { FUNDRAISER_CATEGORIES } from '@/config/constants';
import type { FundraiserView } from '@/types/fundraiser';
import { goalOf } from '@/types/fundraiser';
import { forgetManaged, manageUrl } from '@/lib/manageLinks';
import { CopyButton, Notice, inputClass, primaryButtonClass, secondaryButtonClass } from './ui';
import { LinksEditor, cleanLinks, hasInvalidLinks } from './links';
import type { CampaignLink } from '@/lib/links';
import { errorMessage } from '@/lib/errors';

export function ManagePanel({
  fundraiser,
  token,
  onChanged,
}: {
  fundraiser: FundraiserView;
  token: string;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<null | 'state' | 'save' | 'delete'>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [form, setForm] = useState({
    title: fundraiser.title,
    description: fundraiser.description,
    category: fundraiser.category,
    goal: String(goalOf(fundraiser)),
  });
  const [links, setLinks] = useState<CampaignLink[]>(fundraiser.links ?? []);

  const paused = fundraiser.state === 'pulled';
  const headers = { 'content-type': 'application/json', 'x-manage-token': token };

  async function call(kind: 'state' | 'save' | 'delete', url: string, init: RequestInit) {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(url, { ...init, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-[#c5d3b8] bg-[#f4f7ef] p-5" aria-labelledby="manage-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="manage-title" className="text-sm font-semibold text-[#3d5136]">
            You manage this campaign
          </h2>
          <p className="text-xs text-[#59684a]">Only people with your manage link see this.</p>
        </div>
        <CopyButton value={manageUrl(fundraiser._id, token)} label="Copy manage link" />
      </div>

      {editing ? (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (hasInvalidLinks(links)) return setError('One of your links isn’t a valid link — fix it or remove it.');
            const ok = await call('save', `/api/fundraisers/${fundraiser._id}/edit`, {
              method: 'PUT',
              body: JSON.stringify({ ...form, links: cleanLinks(links) }),
            });
            if (ok) {
              setEditing(false);
              onChanged();
            }
          }}
        >
          <input aria-label="Title" value={form.title} maxLength={100} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          <textarea aria-label="Story" value={form.description} maxLength={2000} rows={6} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-y leading-relaxed`} />
          <div className="grid gap-4 sm:grid-cols-2">
            <select aria-label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
              {FUNDRAISER_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input aria-label={`Goal (${fundraiser.currency})`} type="number" min="0" step="any" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className={inputClass} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Links</p>
            <LinksEditor value={links} onChange={setLinks} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy === 'save'} className={primaryButtonClass}>
              {busy === 'save' ? <Loader2 size={15} className="animate-spin" /> : null} Save changes
            </button>
            <button type="button" onClick={() => setEditing(false)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing(true)} className={secondaryButtonClass}>
            <Pencil size={14} /> Edit details
          </button>
          <button
            type="button"
            disabled={busy === 'state'}
            onClick={async () => {
              const ok = await call('state', `/api/fundraisers/${fundraiser._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ state: paused ? 'on_market' : 'pulled' }),
              });
              if (ok) onChanged();
            }}
            className={secondaryButtonClass}
          >
            {busy === 'state' ? <Loader2 size={14} className="animate-spin" /> : paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? 'Resume campaign' : 'Pause campaign'}
          </button>
        </div>
      )}

      {!editing && (fundraiser.donationCount ?? 0) > 0 ? (
        <p className="mt-5 border-t border-[#c5d3b8] pt-4 text-xs leading-relaxed text-muted-foreground">
          This campaign has received donations, so it stays on OpenFund as a public record of where the money went. You can pause it at
          any time.
        </p>
      ) : !editing ? (
        <details className="mt-5 border-t border-[#c5d3b8] pt-4">
          <summary className="cursor-pointer text-xs font-medium text-[#9b3b2c]">Delete campaign</summary>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            This removes the campaign page for good. Donations already sent stay in your wallet. Type <strong>delete</strong> to confirm.
          </p>
          <div className="mt-3 flex gap-2">
            <input aria-label="Type delete to confirm" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className={`${inputClass} max-w-[160px]`} />
            <button
              type="button"
              disabled={confirmDelete.trim().toLowerCase() !== 'delete' || busy === 'delete'}
              onClick={async () => {
                const ok = await call('delete', `/api/fundraisers/${fundraiser._id}`, { method: 'DELETE' });
                if (ok) {
                  forgetManaged(fundraiser._id);
                  router.push('/fundraisers/my');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#9b3b2c] px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </details>
      ) : null}

      {error ? (
        <Notice tone="error" className="mt-4">
          {error}
        </Notice>
      ) : null}
    </section>
  );
}
