'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PLATFORM_TOKEN } from '@/config/platform';
import { ContractAddress } from '@/components/ContractAddress';

// Renamed at launch so visitors who closed the pre-launch popup see the address.
const DISMISS_KEY = 'openFundTokenLiveSeen';

export function CoinCTAModal() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setShow(sessionStorage.getItem(DISMISS_KEY) !== '1'); }
      catch { setShow(true); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);
  function dismiss() {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* Session storage is optional. */ }
    setShow(false);
  }
  return (
    <Dialog open={show} onOpenChange={open => { if (!open) dismiss(); }}>
      <DialogContent className="max-w-sm border-border bg-card p-7">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">OpenFund · Next chapter</p>
        <DialogTitle className="text-3xl font-medium tracking-tight text-primary">${PLATFORM_TOKEN.ticker}</DialogTitle>
        <DialogDescription className="leading-relaxed">OpenFund now runs on Robinhood Chain, the network pons is built on. Give in ETH from any wallet — no connecting required.</DialogDescription>
        <div className="rounded-lg border border-border bg-background py-3 pl-4 pr-2">
          <p className="mb-1.5 text-xs text-muted-foreground">${PLATFORM_TOKEN.ticker} contract address · Robinhood Chain</p>
          <ContractAddress />
        </div>
        <p className="text-xs text-muted-foreground">
          Live on{' '}
          <a href={PLATFORM_TOKEN.launchpadUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">pons</a>
          . Always check the address matches before you buy.
        </p>
        <button type="button" onClick={dismiss} className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">Enter OpenFund</button>
      </DialogContent>
    </Dialog>
  );
}
