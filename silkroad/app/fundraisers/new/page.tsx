'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Coins, ImagePlus, Loader2 } from 'lucide-react';
import { FUNDRAISER_CATEGORIES } from '@/config/constants';
import { normalizeAddress, ROBINHOOD_CHAIN_ID, ROBINHOOD_CHAIN_NAME } from '@/lib/chain/network';
import { manageUrl, saveManaged } from '@/lib/manageLinks';
import {
  CopyButton,
  Notice,
  PageIntro,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/fundraisers/ui';
import { PiggyBank } from '@/components/mascot/PiggyBank';
import { LinksEditor, cleanLinks, hasInvalidLinks } from '@/components/fundraisers/links';
import type { CampaignLink } from '@/lib/links';
import { errorMessage } from '@/lib/errors';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function Field({ label, hint, children, htmlFor }: { label: string; hint?: React.ReactNode; children: React.ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function NewFundraiserPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [goal, setGoal] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [confirmedAddress, setConfirmedAddress] = useState(false);
  const [links, setLinks] = useState<CampaignLink[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; title: string; link: string } | null>(null);
  const [savedLink, setSavedLink] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [coinAddress, setCoinAddress] = useState('');
  const [importing, setImporting] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);
  const [imported, setImported] = useState<{ symbol: string; name: string; filled: string[] } | null>(null);

  const address = normalizeAddress(payoutAddress);
  const addressTouched = payoutAddress.trim().length > 0;

  /** Fill empty fields from a coin's on-chain profile; never overwrite what the creator typed. */
  async function importCoin() {
    setCoinError(null);
    setImported(null);
    const ca = normalizeAddress(coinAddress);
    if (!ca) return setCoinError('That isn’t a valid 0x contract address.');
    setImporting(true);
    try {
      const res = await fetch('/api/coin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: ca }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Couldn’t read that coin');
      const coin = data.coin as { name: string; symbol: string; description: string; imageUrl: string | null; links: CampaignLink[] };

      const filled: string[] = [];
      if (!title.trim() && coin.name) {
        setTitle(coin.name.slice(0, 100));
        filled.push('title');
      }
      if (!description.trim() && coin.description) {
        setDescription(coin.description.slice(0, 2000));
        filled.push('story');
      }
      if (!imageUrl && coin.imageUrl) {
        setImageUrl(coin.imageUrl);
        filled.push('cover');
      }
      const existing = new Set(links.map((l) => l.url.trim()));
      const newLinks = coin.links.filter((l) => !existing.has(l.url));
      if (newLinks.length) {
        setLinks([...links.filter((l) => l.url.trim()), ...newLinks]);
        filled.push(`${newLinks.length} link${newLinks.length === 1 ? '' : 's'}`);
      }
      setImported({ symbol: coin.symbol, name: coin.name, filled });
    } catch (err) {
      setCoinError(errorMessage(err, 'Couldn’t read that coin'));
    } finally {
      setImporting(false);
    }
  }

  async function uploadImage(file: File) {
    setError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Cover images must be JPG, PNG or WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Cover images must be under 5 MB.');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch('/api/upload/image', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) throw new Error(data.error || 'Upload failed');
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) return setError('Enter the wallet address donations should go to.');
    if (!confirmedAddress) return setError(`Confirm the address is yours and works on ${ROBINHOOD_CHAIN_NAME}.`);
    if (!imageUrl) return setError('Add a cover image.');
    if (hasInvalidLinks(links)) return setError('One of your links isn’t a valid link — fix it or remove it.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/fundraisers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, description, category, goal, payoutAddress: address, imageUrl, links: cleanLinks(links) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create the campaign');

      const id = data.fundraiser._id as string;
      saveManaged(id, data.manageToken, data.fundraiser.title);
      setCreated({ id, title: data.fundraiser.title, link: manageUrl(id, data.manageToken) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-24 md:px-8">
        <div className="mb-6 w-44">
          <PiggyBank pose="happy" size={176} />
        </div>
        <PageIntro eyebrow="YOU'RE LIVE" title="Your campaign" accent="is up.">
          &ldquo;{created.title}&rdquo; is live now. Share it and donations go straight to your wallet.
        </PageIntro>

        <div className="rounded-2xl border border-[#e6d3a8] bg-[#faf3e2] p-6">
          <p className="mb-1 text-sm font-semibold text-[#7a5a1c]">Save your manage link — it&rsquo;s the only way to edit this campaign.</p>
          <p className="mb-4 text-sm leading-relaxed text-[#7a5a1c]">
            There are no accounts, so this private link is your key. Anyone who has it can edit, pause or delete the
            campaign — it can&rsquo;t change where donations go. Keep it somewhere safe and don&rsquo;t share it.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-[#e6d3a8] bg-card p-2 pl-3">
            <code className="min-w-0 flex-1 truncate text-xs text-foreground">{created.link}</code>
            <CopyButton value={created.link} label="Copy link" />
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-[#7a5a1c]">
            <input type="checkbox" checked={savedLink} onChange={(e) => setSavedLink(e.target.checked)} className="mt-0.5 accent-[#3d5136]" />
            I&rsquo;ve saved my manage link somewhere safe.
          </label>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/fundraisers/${created.id}`}
            aria-disabled={!savedLink}
            onClick={(e) => !savedLink && e.preventDefault()}
            className={`${primaryButtonClass} ${savedLink ? '' : 'pointer-events-none opacity-50'}`}
          >
            View your campaign <ArrowUpRight size={16} />
          </Link>
          <Link href="/fundraisers/my" className={secondaryButtonClass}>
            My fundraisers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 md:px-8">
      <PageIntro eyebrow="START A FUNDRAISER" title="Tell people" accent="what it's for.">
        It goes live the moment you publish. No account, no review queue, no wallet connection — just the address you
        want donations sent to.
      </PageIntro>

      <div className="mb-10 rounded-2xl border border-border bg-card p-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
          <Coins size={15} className="text-primary" /> Raising for a coin community?
        </p>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          Paste its contract address on {ROBINHOOD_CHAIN_NAME} and we&rsquo;ll fill in the name, logo, story and socials straight from the
          chain. Works with coins launched on pons. You can change anything before publishing.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Coin contract address"
            value={coinAddress}
            onChange={(e) => setCoinAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                importCoin();
              }
            }}
            placeholder="0x… coin contract address"
            spellCheck={false}
            autoComplete="off"
            className={`${inputClass} min-w-0 flex-1 font-mono text-[13px]`}
          />
          <button type="button" onClick={importCoin} disabled={importing || !coinAddress.trim()} className={secondaryButtonClass}>
            {importing ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Reading the chain…
              </>
            ) : (
              'Fill in from coin'
            )}
          </button>
        </div>
        {coinError ? <p className="mt-2 text-xs text-[#9b3b2c]">{coinError}</p> : null}
        {imported ? (
          <p className="mt-3 text-xs leading-relaxed text-primary">
            {imported.filled.length
              ? `Filled in the ${imported.filled.join(', ')} from ${imported.symbol ? `$${imported.symbol}` : imported.name}. Check it over — `
              : `Found ${imported.symbol ? `$${imported.symbol}` : imported.name}, but your fields already have content so nothing was replaced. `}
            the payout wallet is still yours to enter below.
          </p>
        ) : null}
      </div>

      <form onSubmit={submit} className="space-y-7" noValidate>
        <Field label="Title" htmlFor="title" hint={`${title.trim().length}/100 · at least 5 characters`}>
          <input id="title" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Help Maya get her surgery" required />
        </Field>

        <Field label="Your story" htmlFor="description" hint={`${description.trim().length}/2000 · at least 50 characters. Say what the money is for and why it matters.`}>
          <textarea id="description" value={description} maxLength={2000} rows={7} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-y leading-relaxed`} required />
        </Field>

        <div className="grid gap-7 sm:grid-cols-2">
          <Field label="Category" htmlFor="category">
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} required>
              <option value="" disabled>
                Choose one
              </option>
              {FUNDRAISER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Goal (ETH)" htmlFor="goal" hint="A target, not a threshold — you keep whatever is given.">
            <input id="goal" type="number" inputMode="decimal" min="0" step="any" value={goal} onChange={(e) => setGoal(e.target.value)} className={inputClass} placeholder="1.5" required />
          </Field>
        </div>

        <Field label="Cover image" htmlFor="cover" hint="JPG, PNG or WebP, up to 5 MB.">
          <input
            ref={fileInput}
            id="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-input bg-card text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Cover preview" className="absolute inset-0 h-full w-full object-cover" />
            ) : uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Uploading…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ImagePlus size={17} /> Choose an image
              </span>
            )}
          </button>
        </Field>

        <div className="rounded-2xl border border-border bg-card p-5">
          <Field
            label="Where should donations go?"
            htmlFor="payout"
            hint={
              <>
                Your wallet address on <strong className="text-foreground">{ROBINHOOD_CHAIN_NAME}</strong> (chain ID {ROBINHOOD_CHAIN_ID}).
                It starts with 0x and is shown publicly so donors can send to it. It can&rsquo;t be changed later.
              </>
            }
          >
            <input
              id="payout"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              className={`${inputClass} font-mono text-[13px] ${addressTouched && !address ? 'border-[#e8c4bd] focus:border-[#e8c4bd]' : ''}`}
              placeholder="0x…"
              spellCheck={false}
              autoComplete="off"
              required
            />
          </Field>
          {addressTouched && !address ? <p className="mt-2 text-xs text-[#9b3b2c]">That isn&rsquo;t a valid 0x address.</p> : null}
          <Notice tone="warning" className="mt-4 text-xs">
            Use a wallet you control, like MetaMask or Rabby. <strong>Don&rsquo;t use an exchange deposit address</strong> — exchanges
            may not credit transfers from Robinhood Chain.
          </Notice>
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
            <input type="checkbox" checked={confirmedAddress} onChange={(e) => setConfirmedAddress(e.target.checked)} className="mt-0.5 accent-[#3d5136]" />
            This is my own wallet and it can receive ETH on {ROBINHOOD_CHAIN_NAME}.
          </label>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-1 text-sm font-medium text-foreground">Links</p>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            Add as many as you like — a YouTube video (it plays right on your page), your X or Telegram, a website, GitHub, anything that helps
            people trust and understand your cause.
          </p>
          <LinksEditor value={links} onChange={setLinks} />
        </div>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <button type="submit" disabled={submitting || uploading} className={`${primaryButtonClass} w-full sm:w-auto`}>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Publishing…
            </>
          ) : (
            <>
              Publish campaign <ArrowUpRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
