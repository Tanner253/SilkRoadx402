'use client';

/**
 * Wallet-less donating, address-first:
 *   1. the donor tells us which wallet they'll send from;
 *   2. we reveal the campaign address and start watching the chain for a
 *      transfer from that wallet to it;
 *   3. it's counted when it lands (the banner keeps them posted site-wide).
 *
 * The campaign address is deliberately shown only after step 1: a gift from
 * an unregistered wallet can't be attributed, so it would never be counted.
 */

import { useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import type { FundraiserView } from '@/types/fundraiser';
import { ROBINHOOD_CHAIN_ID, ROBINHOOD_CHAIN_NAME, normalizeAddress } from '@/lib/chain/network';
import { formatAmount, shortAddress } from '@/lib/format';
import { useWatches } from '@/components/donations/WatchProvider';
import { ShareGift } from '@/components/donations/ShareGift';
import { CopyButton, Notice, Pill, inputClass, primaryButtonClass } from './ui';
import { errorMessage } from '@/lib/errors';

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-center text-sm font-medium text-foreground">
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{n}</span>
      {children}
    </p>
  );
}

export function DonatePanel({ fundraiser }: { fundraiser: FundraiserView }) {
  const { watches, lastDonor, register, checkNow } = useWatches();
  // null = untouched, so the last-used wallet can prefill it; '' = cleared.
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  if (fundraiser.network !== 'robinhood') {
    return <Notice>This campaign ran on Solana before OpenFund moved to {ROBINHOOD_CHAIN_NAME}, and is closed to new donations.</Notice>;
  }
  if (fundraiser.state === 'pulled') {
    return <Notice>This campaign isn&rsquo;t taking donations right now.</Notice>;
  }

  const mine = watches.filter((w) => w.fundraiserId === fundraiser._id);
  const open = mine.find((w) => w.status === 'watching' || w.status === 'needs_archive');
  const found = mine.filter((w) => w.status === 'found');
  const givenTotal = found.reduce((sum, w) => sum + w.found.reduce((s, d) => s + d.amount, 0), 0);
  const latestGiftId = found.flatMap((w) => w.found).reverse().find((d) => d.giftId)?.giftId ?? null;
  const typed = address ?? (changing ? '' : lastDonor ?? '');
  const valid = normalizeAddress(typed);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setError('Enter the wallet address you’ll send from — it starts with 0x.');
    setBusy(true);
    setError(null);
    try {
      await register(fundraiser._id, valid);
      setAddress(null);
      setChanging(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (open && !changing) {
    return (
      <div className="space-y-5">
        <div>
          <Step n={2}>Send ETH to this campaign</Step>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Pill>
              {ROBINHOOD_CHAIN_NAME} · {ROBINHOOD_CHAIN_ID}
            </Pill>
            <span className="text-[11px] text-muted-foreground">min 0.00001 ETH</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 pl-3">
            <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] leading-snug text-foreground">{fundraiser.wallet}</code>
            <CopyButton value={fundraiser.wallet} label="Copy" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Send from <span className="font-mono text-foreground">{shortAddress(open.donor)}</span> on{' '}
            <strong className="text-foreground">{ROBINHOOD_CHAIN_NAME}</strong> — not Ethereum mainnet, and not from an exchange.
          </p>
        </div>

        <div className="rounded-lg border border-[#c5d3b8] bg-[#f4f7ef] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-[#3d5136]">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#62754d] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#62754d]" />
            </span>
            Watching for your transfer
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#59684a]">
            It&rsquo;s counted automatically once it arrives — usually within seconds. You can leave this page; we&rsquo;ll keep you posted.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                setChecking(true);
                await checkNow();
                setChecking(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#c5d3b8] bg-card px-3 py-1.5 text-xs font-medium text-[#3d5136] hover:bg-[#eef3e8]"
            >
              {checking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Check now
            </button>
            <button type="button" onClick={() => {
                setChanging(true);
                setAddress('');
              }} className="px-2 text-xs text-[#59684a] underline-offset-2 hover:underline">
              Sending from a different wallet?
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={start} className="space-y-4">
      {found.length && !changing ? (
        <Notice tone="success" className="space-y-3">
          <span className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>You&rsquo;ve given {formatAmount(givenTotal, 'ETH')} to this campaign — thank you! You can give again below.</span>
          </span>
          {latestGiftId ? <div className="pl-6"><ShareGift giftId={latestGiftId} fundraiserId={fundraiser._id} amount={givenTotal} title={fundraiser.title} /></div> : null}
        </Notice>
      ) : null}

      <div>
        <Step n={1}>Which wallet will you send from?</Step>
        <input
          aria-label="Your wallet address"
          value={typed}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x…"
          spellCheck={false}
          autoComplete="off"
          className={`${inputClass} font-mono text-[12.5px]`}
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Your donation is only counted if we know which wallet it comes from.</strong> We watch the chain
          for a transfer from this address to the campaign. No connecting, no signing — it&rsquo;s only your public address.
        </p>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <button type="submit" disabled={busy || !typed.trim()} className={`${primaryButtonClass} w-full`}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : null} Show me where to send
      </button>
      {changing ? (
        <button type="button" onClick={() => { setChanging(false); setAddress(null); }} className="w-full text-xs text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      ) : null}
    </form>
  );
}
