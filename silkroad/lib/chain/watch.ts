/**
 * Finding a donor's transfer from their address alone — cheaply.
 *
 * Every transaction a wallet sends increments its nonce by exactly one, and
 * the nonce is readable at any block the node still has state for. So:
 *
 *   1. A donor registers their address. We note the block and their nonce.
 *   2. Each check asks one question: "what's their nonce now?" (2 RPC calls).
 *      Unchanged → nothing was sent; move the cursor to now.
 *   3. When it has gone up, each new transaction is found by binary-searching
 *      for the block where the nonce ticked past it (~log2(blocks) calls),
 *      then reading that single block. Transfers to the campaign address are
 *      then verified exactly like any other donation.
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
/** Look-back when a watch starts, to catch "I already sent it" (~8 minutes). */
export const REGISTER_LOOKBACK = 4_800;
/** Most nonce steps resolved in one check; the rest wait for the next. Bounds cost. */
const MAX_STEPS_PER_CHECK = 5;

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
  /** True if more steps remain beyond this check's budget. */
  more: boolean;
}

/**
 * Everything `donor` sent after `cursor`, up to MAX_STEPS_PER_CHECK txs.
 * Throws NeedsArchiveError if history beyond the public window is required
 * and no archive RPC is configured.
 */
export async function scanSince(
  donor: `0x${string}`,
  cursor: { block: bigint; nonce: number },
  meter: CallMeter = { calls: 0 },
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

  const sent: SentTx[] = [];
  let lo = cursor.block; // nonce(lo) <= n for the nonce n being searched
  const target = Math.min(nowNonce, cursor.nonce + MAX_STEPS_PER_CHECK);

  for (let n = cursor.nonce; n < target; n++) {
    // Smallest block b in (lo, head] with nonce(b) > n: the block holding nonce n.
    let low = lo;
    let high = head;
    while (high - low > BigInt(1)) {
      const mid = low + (high - low) / BigInt(2);
      if ((await nonceAt(donor, mid, meter, client)) > n) high = mid;
      else low = mid;
    }
    meter.calls++;
    const block = await client.getBlock({ blockNumber: high, includeTransactions: true });
    const tx = block.transactions.find((t) => getAddress(t.from) === donor && t.nonce === n);
    if (tx) sent.push({ hash: tx.hash, to: tx.to ? getAddress(tx.to) : null, block: high, nonce: n });
    // The next nonce can't be in an earlier block.
    lo = high - BigInt(1);
  }

  const resolvedAll = target === nowNonce;
  return {
    sent,
    // If we stopped early, resume just before the last block we resolved so
    // the next search starts from known ground.
    cursor: resolvedAll ? { block: head, nonce: nowNonce } : { block: lo, nonce: target },
    more: !resolvedAll,
  };
}
