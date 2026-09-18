'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PLATFORM_TOKEN } from '@/config/platform';

const DISMISS_KEY = 'openFundEthereumCTASeen';

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
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="mb-2 text-xs text-muted-foreground">Contract address</p>
          <code className="text-sm text-primary">{PLATFORM_TOKEN.contractAddress}</code>
        </div>
        <p className="text-xs text-muted-foreground">The new $OPEN contract address will be announced at launch.</p>
        <button type="button" onClick={dismiss} className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">Enter OpenFund</button>
      </DialogContent>
    </Dialog>
  );
}
