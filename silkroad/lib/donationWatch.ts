/**
 * Donation watches: register a donor's wallet for a campaign, then check the
 * chain for their transfer. Server-only.
 *
 * Cost control (the RPC is shared and rate-limited):
 *  - a watch is checked at most once per CHECK_INTERVAL_MS, however many tabs
 *    poll it — enforced atomically in the database, not by the client;
 *  - an idle check is two RPC calls; finding a transfer is ~15 more;
 *  - watches expire after WATCH_TTL_MS and are never checked again.
 */

import type { Types } from 'mongoose';
import { Fundraiser } from '@/models/Fundraiser';
import { Transaction } from '@/models/Transaction';
import { DonationWatch, type IDonationWatch, type WatchStatus } from '@/models/DonationWatch';
import { createLog } from '@/lib/logger';
import { DonationVerificationError, normalizeAddress, verifyDonationTx } from '@/lib/chain/robinhood';
import { NeedsArchiveError, scanSince, startCursor, type CallMeter } from '@/lib/chain/watch';
import { isDuplicateKeyError } from '@/lib/errors';

export const CHECK_INTERVAL_MS = 6_000;
export const WATCH_TTL_MS = 48 * 60 * 60 * 1000;
/** Allowed skew between our clock and block timestamps. */
const CLOCK_SKEW_MS = 60 * 1000;
/** Dust floor: sending 1 wei costs nothing on an L2 and would flood logs. */
export const MIN_DONATION_WEI = BigInt('10000000000000'); // 0.00001 ETH

export class WatchError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface WatchView {
  id: string;
  fundraiserId: string;
  fundraiserTitle: string;
  donor: string;
  recipient: string;
  status: WatchStatus;
  found: { txHash: string; amount: number }[];
  expiresAt: string;
  createdAt: string;
}

async function loadCampaign(fundraiserId: string) {
  const fundraiser = await Fundraiser.findById(fundraiserId);
  if (!fundraiser) throw new WatchError(404, 'Campaign not found');
  if (fundraiser.network !== 'robinhood') throw new WatchError(400, 'This campaign predates Robinhood Chain and can’t take donations.');
  if (fundraiser.state === 'pulled') throw new WatchError(400, 'This campaign isn’t taking donations right now.');
  const recipient = normalizeAddress(fundraiser.wallet);
  if (!recipient) throw new WatchError(500, 'This campaign has no valid receiving address.');
  return { fundraiser, recipient };
}

/** Create (or reuse) a watch for this donor and campaign. */
export async function registerWatch(fundraiserId: string, donorInput: unknown, meter?: CallMeter) {
  const donor = normalizeAddress(donorInput);
  if (!donor) throw new WatchError(400, 'Enter the wallet address you’re sending from (it starts with 0x).');

  const { fundraiser, recipient } = await loadCampaign(fundraiserId);
  if (donor === recipient) throw new WatchError(400, 'That’s the campaign’s own address — enter the wallet you’re sending from.');

  const existing = await DonationWatch.findOne({
    fundraiserId,
    donor,
    status: { $in: ['watching', 'needs_archive'] },
    expiresAt: { $gt: new Date() },
  });
  if (existing) return { watch: existing, title: fundraiser.title };

  const cursor = await startCursor(donor, meter);
  const watch = await DonationWatch.create({
    fundraiserId,
    donor,
    recipient,
    cursorBlock: cursor.block.toString(),
    cursorNonce: cursor.nonce,
    expiresAt: new Date(Date.now() + WATCH_TTL_MS),
  });
  await createLog('donation_watch', `Watching ${donor} → "${fundraiser.title}"`, donor);
  return { watch, title: fundraiser.title };
}

/**
 * Verify a transaction and credit it to the campaign. Idempotent: the unique
 * index on Transaction.txnHash guarantees a hash is credited at most once.
 */
async function creditDonation(fundraiserId: string, hash: `0x${string}`, donor: `0x${string}`, recipient: `0x${string}`, createdAt: Date) {
  if (await Transaction.exists({ txnHash: hash })) return 'duplicate' as const;
  try {
    const verified = await verifyDonationTx({
      hash,
      recipient,
      sender: donor,
      notBefore: new Date(createdAt.getTime() - CLOCK_SKEW_MS),
    });
    if (verified.valueWei < MIN_DONATION_WEI) return 'below_minimum' as const;

    await Transaction.create({
      listingId: fundraiserId,
      buyerWallet: verified.from,
      sellerWallet: verified.to,
      amount: Number(verified.valueEth),
      amountWei: verified.valueWei.toString(),
      txnHash: verified.hash,
      blockNumber: Number(verified.blockNumber),
      network: 'robinhood',
      currency: 'ETH',
      status: 'success',
      createdAt: verified.timestamp,
    });
    await Fundraiser.updateOne({ _id: fundraiserId }, { $inc: { raisedAmount: Number(verified.valueEth) } });
    await createLog('fundraiser_donated', `Donation of ${verified.valueEth} ETH (${verified.hash})`, verified.from);
    return 'credited' as const;
  } catch (err) {
    if (isDuplicateKeyError(err)) return 'duplicate' as const; // lost a race to an identical check
    if (err instanceof DonationVerificationError) return err.reason;
    throw err;
  }
}

/**
 * Check one watch against the chain. Returns the (possibly updated) watch.
 * Skips the RPC entirely if it was checked within CHECK_INTERVAL_MS.
 */
export async function checkWatch(id: string, meter: CallMeter = { calls: 0 }): Promise<IDonationWatch | null> {
  const now = new Date();

  // Claim the check atomically so concurrent polls can't all hit the RPC.
  const watch = await DonationWatch.findOneAndUpdate(
    {
      _id: id,
      status: { $in: ['watching', 'needs_archive'] },
      $or: [{ lastCheckedAt: { $exists: false } }, { lastCheckedAt: { $lt: new Date(now.getTime() - CHECK_INTERVAL_MS) } }],
    },
    { $set: { lastCheckedAt: now } },
    { new: true },
  );
  if (!watch) return DonationWatch.findById(id);

  if (watch.expiresAt < now) {
    watch.status = 'expired';
    await watch.save();
    return watch;
  }

  const fundraiser = await Fundraiser.findById(watch.fundraiserId).select('createdAt state');
  if (!fundraiser || fundraiser.state === 'pulled') return watch;

  const donor = normalizeAddress(watch.donor)!;
  const recipient = normalizeAddress(watch.recipient)!;

  let scan;
  try {
    scan = await scanSince(donor, { block: BigInt(watch.cursorBlock), nonce: watch.cursorNonce }, meter);
  } catch (err) {
    if (err instanceof NeedsArchiveError) {
      if (watch.status !== 'needs_archive') {
        watch.status = 'needs_archive';
        await watch.save();
      }
      return watch;
    }
    throw err;
  }

  for (const tx of scan.sent) {
    if (tx.to !== recipient) continue;
    const outcome = await creditDonation(watch.fundraiserId, tx.hash, donor, recipient, fundraiser.createdAt);
    if (outcome === 'credited' || outcome === 'duplicate') {
      if (!watch.foundTxHashes.includes(tx.hash)) watch.foundTxHashes.push(tx.hash);
    }
  }

  watch.cursorBlock = scan.cursor.block.toString();
  watch.cursorNonce = scan.cursor.nonce;
  if (watch.foundTxHashes.length) watch.status = 'found';
  else if (watch.status === 'needs_archive') watch.status = 'watching';
  await watch.save();
  return watch;
}

export async function viewWatches(watches: IDonationWatch[]): Promise<WatchView[]> {
  if (!watches.length) return [];
  const [campaigns, donations] = await Promise.all([
    Fundraiser.find({ _id: { $in: watches.map((w) => w.fundraiserId) } }).select('title').lean<{ _id: Types.ObjectId; title: string }[]>(),
    Transaction.find({ txnHash: { $in: watches.flatMap((w) => w.foundTxHashes) } }).select('txnHash amount').lean<{ txnHash: string; amount: number }[]>(),
  ]);
  const titles = new Map(campaigns.map((c) => [c._id.toString(), c.title]));
  const amounts = new Map(donations.map((d) => [d.txnHash, d.amount]));

  return watches.map((w) => ({
    id: String(w._id),
    fundraiserId: w.fundraiserId,
    fundraiserTitle: titles.get(w.fundraiserId) ?? 'A campaign',
    donor: w.donor,
    recipient: w.recipient,
    status: w.status,
    found: w.foundTxHashes.map((h) => ({ txHash: h, amount: amounts.get(h) ?? 0 })),
    expiresAt: w.expiresAt.toISOString(),
    createdAt: w.createdAt.toISOString(),
  }));
}
