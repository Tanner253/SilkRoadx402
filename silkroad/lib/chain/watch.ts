/**
 * Finding a donor's transfer from their address alone — cheaply.
 *
 * Every transaction a wallet sends increments its nonce by exactly one, and
 * the nonce is readable at any block the node still has state for. So:
 *
 *   1. A donor registers their address. We note the block and their nonce.
 *   2. Each check asks one question: "what's their nonce now?" (2 RPC calls).
 *      Unchanged → nothing was sent; move the cursor to now.
 *   3. When it has gone up, each new transaction is found by searching for
 *      the block where the nonce ticked past it (gallop, then binary search:
 *      ~log2(blocks) calls), then reading that single block. Transfers to the
 *      campaign address are then verified exactly like any other donation.
 *
 * Robinhood Chain makes ~10 blocks a second, so scanning blocks would cost
 * thousands of calls; this costs a handful. The one limit: the public RPC
 * only keeps ~10 minutes of state. A cursor older than that can still be
 * advanced when the nonce hasn't moved, but finding *which* block needs
 * history — for that we fall back to ROBINHOOD_ARCHIVE_RPC_URL if configured,
 * and otherwise report `needs_archive` so the watch waits rather than guesses.
 *
 * Only transactions the donor's own address sends are visible this way:
 * transfers from an exchange withdrawal or through a smart-contract wallet
 * come from a different address and can't be matched.
 */

import { createPublicClient, getAddress, http, type Hash, type PublicClient } from 'viem';
import { ROBINHOOD_RPC_URL, robinhoodChain } from './network';

/** How far back the public node reliably serves state (measured ~6,200). */
export const PUBLIC_STATE_WINDOW = 5_000;
/**
 * Look-back when a watch starts (~1 minute). The campaign address is only
 * shown after a donor registers, so this just covers clock and UI slack —
 * and keeps the starting cursor far inside the public state window, so even
 * a busy wallet has plenty of room to catch up.
 */
export const REGISTER_LOOKBACK = 600;
/** Hard cap on nonce steps per scan; the time budget usually stops it first. */
const MAX_STEPS_PER_SCAN = 60;
/** Default time budget for one scan. */
const DEFAULT_BUDGET_MS = 5_000;

const transport = (url: string) => http(url, { retryCount: 2, retryDelay: 400, timeout: 10_000 });

const live: PublicClient = createPublicClient({ chain: robinhoodChain, transport: transport(ROBINHOOD_RPC_URL) });
const archiveUrl = process.env.ROBINHOOD_ARCHIVE_RPC_URL;
const archive: PublicClient | null = archiveUrl
  ? createPublicClient({ chain: robinhoodChain, transport: transport(archiveUrl) })
  : null;

export class NeedsArchiveError extends Error {
  constructor() {
    super('This watch lapsed beyond what the public RPC remembers; an archive RPC is needed to look further back.');
  }
}

/** Counts RPC calls per operation so tests and logs can see the real cost. */
export interface CallMeter {
  calls: number;
}

export async function headBlock(meter?: CallMeter): Promise<bigint> {
  if (meter) meter.calls++;
  return live.getBlockNumber({ cacheTime: 0 });
}

export async function nonceAt(address: `0x${string}`, block: bigint | 'latest', meter?: CallMeter, client: PublicClient = live) {
  if (meter) meter.calls++;
  return client.getTransactionCount(
    block === 'latest' ? { address, blockTag: 'latest' } : { address, blockNumber: block },
  );
}

/** Starting point for a new watch: a little in the past, with the nonce then. */
export async function startCursor(address: `0x${string}`, meter?: CallMeter) {
  const head = await headBlock(meter);
  const block = head > BigInt(REGISTER_LOOKBACK) ? head - BigInt(REGISTER_LOOKBACK) : BigInt(0);
  const nonce = await nonceAt(address, block, meter);
  return { block, nonce };
}

export interface SentTx {
  hash: Hash;
  to: `0x${string}` | null;
  block: bigint;
  nonce: number;
}

export interface ScanResult {
  /** Transactions the donor sent since the cursor (any recipient). */
  sent: SentTx[];
  /** Where the next check should resume. */
  cursor: { block: bigint; nonce: number };
  /** True if more remains beyond this scan's budget. */
  more: boolean;
}

/**
 * Everything `donor` sent after `cursor`, until `deadline` (epoch ms) or
 * MAX_STEPS_PER_SCAN transactions. Always makes at least one step, so a busy
 * wallet still progresses. Throws NeedsArchiveError if history beyond the
 * public window is needed and no archive RPC is configured.
 *
 * Locating the block that holds nonce n: gallop forward from the last known
 * block (+1, +2, +4 …) until the nonce there exceeds n, then binary-search
 * inside that bracket. Busy wallets send often, so the bracket is usually
 * small; a one-off donor still costs only ~log2(blocks). Fetched blocks are
 * cached, so several of the donor's transactions in one block cost one read.
 *
 * Invariant: nonce(lo) <= n, where n is the next unresolved nonce. The
 * returned cursor keeps it, so the next scan resumes exactly where this one
 * stopped.
 */
export async function scanSince(
  donor: `0x${string}`,
  cursor: { block: bigint; nonce: number },
  meter: CallMeter = { calls: 0 },
  deadline: number = Date.now() + DEFAULT_BUDGET_MS,
): Promise<ScanResult> {
  const head = await headBlock(meter);
  const nowNonce = await nonceAt(donor, head, meter);

  if (nowNonce <= cursor.nonce) {
    // Nothing sent since the cursor — safe to jump straight to the head, no
    // history needed. This is what keeps idle watches inside the window.
    return { sent: [], cursor: { block: head, nonce: nowNonce }, more: false };
  }

  const withinPublic = head - cursor.block <= BigInt(PUBLIC_STATE_WINDOW);
  const client = withinPublic ? live : archive;
  if (!client) throw new NeedsArchiveError();

  const one = BigInt(1);
  const two = BigInt(2);
  const cache = new Map<bigint, Awaited<ReturnType<typeof client.getBlock<true>>>>();
  const readBlock = async (number: bigint) => {
    let block = cache.get(number);
    if (!block) {
      meter.calls++;
      block = await client.getBlock({ blockNumber: number, includeTransactions: true });
      cache.set(number, block);
    }
    return block;
  };

  const sent: SentTx[] = [];
  let lo = cursor.block;
  let n = cursor.nonce;
  const cap = Math.min(nowNonce, cursor.nonce + MAX_STEPS_PER_SCAN);

  while (n < cap && (n === cursor.nonce || Date.now() < deadline)) {
    // Gallop to a bracket (lo, high] with nonce(high) > n.
    let step = one;
    let high = lo + step < head ? lo + step : head;
    while (high < head && (await nonceAt(donor, high, meter, client)) <= n) {
      lo = high;
      step *= two;
      high = lo + step < head ? lo + step : head;
    }
    // Binary-search the smallest block in the bracket with nonce > n.
    while (high - lo > one) {
      const mid = lo + (high - lo) / two;
      if ((await nonceAt(donor, mid, meter, client)) > n) high = mid;
      else lo = mid;
    }

    // Block `high` holds nonce n, and possibly the donor's next ones too.
    const block = await readBlock(high);
    const mine = block.transactions
      .filter((t) => getAddress(t.from) === donor && t.nonce >= n)
      .sort((a, b) => a.nonce - b.nonce);
    const before = n;
    for (const tx of mine) {
      if (tx.nonce !== n) break;
      sent.push({ hash: tx.hash, to: tx.to ? getAddress(tx.to) : null, block: high, nonce: n });
      n++;
    }
    // Nonce n wasn't where the chain said it was: inconsistent RPC state.
    // Stop and let the next check retry from here rather than guess.
    if (n === before) break;
    // nonce(high - 1) <= the first nonce consumed above <= n.
    lo = high - one;
  }

  const done = n >= nowNonce;
  return {
    sent,
    cursor: done ? { block: head, nonce: nowNonce } : { block: lo, nonce: n },
    more: !done,
  };
}
