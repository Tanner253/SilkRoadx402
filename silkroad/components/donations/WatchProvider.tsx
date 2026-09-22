'use client';

/**
 * Shared state for this browser's donation watches: the reminder banner, the
 * donate box and the comment form all read from here, and there is exactly
 * one poller.
 *
 * Polling is deliberately gentle — the server throttles per watch anyway, but
 * there's no reason to ask more often than a transfer could plausibly land:
 *  - only while at least one watch is open and the tab is visible;
 *  - every 8 s for a watch's first 10 minutes, then every 30 s, then 2 min.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type WatchStatus = 'watching' | 'found' | 'expired' | 'needs_archive';

export interface Watch {
  id: string;
  fundraiserId: string;
  fundraiserTitle: string;
  donor: string;
  recipient: string;
  status: WatchStatus;
  found: { txHash: string; amount: number; giftId: string | null }[];
  expiresAt: string;
  createdAt: string;
}

interface WatchContextValue {
  watches: Watch[];
  loaded: boolean;
  /** Most recently used donor address, to prefill forms. */
  lastDonor: string | null;
  register: (fundraiserId: string, donorAddress: string) => Promise<Watch>;
  checkNow: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  /** Hide a finished watch from the banner (kept for comments). */
  acknowledge: (id: string) => void;
  acknowledged: Set<string>;
}

const WatchContext = createContext<WatchContextValue | null>(null);
const ACK_KEY = 'openfund.ack.v1';

const isOpen = (w: Watch) => w.status === 'watching' || w.status === 'needs_archive';

function pollDelay(watches: Watch[]): number | null {
  const open = watches.filter(isOpen);
  if (!open.length) return null;
  const youngest = Math.min(...open.map((w) => Date.now() - new Date(w.createdAt).getTime()));
  if (youngest < 10 * 60_000) return 8_000;
  if (youngest < 60 * 60_000) return 30_000;
  return 120_000;
}

export function WatchProvider({ children }: { children: ReactNode }) {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const inFlight = useRef(false);

  useEffect(() => {
    try {
      setAcknowledged(new Set(JSON.parse(localStorage.getItem(ACK_KEY) || '[]')));
    } catch {
      /* storage blocked — banner just shows finished watches until dismissed */
    }
    fetch('/api/donation-watch', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setWatches(d.watches ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const checkNow = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch('/api/donation-watch/check', { method: 'POST', cache: 'no-store' });
      if (res.ok) setWatches((await res.json()).watches ?? []);
    } catch {
      /* offline or RPC hiccup — the next tick retries */
    } finally {
      inFlight.current = false;
    }
  }, []);

  // One poller for the whole app.
  useEffect(() => {
    const delay = pollDelay(watches);
    if (delay === null) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') checkNow();
      else setWatches((w) => [...w]); // re-arm without calling out
    }, delay);
    return () => window.clearTimeout(timer);
  }, [watches, checkNow]);

  // Check promptly when the donor comes back to the tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && watches.some(isOpen)) checkNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [watches, checkNow]);

  const register = useCallback(async (fundraiserId: string, donorAddress: string) => {
    const res = await fetch('/api/donation-watch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fundraiserId, donorAddress }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Couldn’t start watching for your donation.');
    const watch: Watch = data.watch;
    setWatches((prev) => [watch, ...prev.filter((w) => w.id !== watch.id)]);
    return watch;
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setWatches((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/donation-watch?id=${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const acknowledge = useCallback((id: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem(ACK_KEY, JSON.stringify(Array.from(next).slice(-50)));
      } catch {
        /* non-essential */
      }
      return next;
    });
  }, []);

  const value = useMemo<WatchContextValue>(
    () => ({
      watches,
      loaded,
      lastDonor: watches[0]?.donor ?? null,
      register,
      checkNow,
      dismiss,
      acknowledge,
      acknowledged,
    }),
    [watches, loaded, register, checkNow, dismiss, acknowledge, acknowledged],
  );

  return <WatchContext.Provider value={value}>{children}</WatchContext.Provider>;
}

export function useWatches() {
  const ctx = useContext(WatchContext);
  if (!ctx) throw new Error('useWatches must be used inside <WatchProvider>');
  return ctx;
}
