/**
 * A single verified donation, as shown on its public /gift/[id] share page.
 * Only what's already public on-chain: donor address, amount, time, and the
 * campaign it went to. Hidden (moderator-removed) campaigns have no gift pages.
 */

import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Fundraiser } from '@/models/Fundraiser';
import { raisedTotals } from '@/lib/fundraiserTotals';
import { decodeEscaped } from '@/lib/validation/sanitization';

export interface Gift {
  id: string;
  donor: string;
  amount: number;
  at: string;
  fundraiser: { id: string; title: string; imageUrl?: string; goal: number; raised: number };
}

export async function getGift(id: string): Promise<Gift | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const tx = await Transaction.findById(id)
    .select('listingId buyerWallet amount createdAt status network currency')
    .lean<{ listingId: string; buyerWallet: string; amount: number; createdAt: Date; status: string; network?: string; currency?: string }>();
  if (!tx || tx.status !== 'success' || tx.network !== 'robinhood' || tx.currency !== 'ETH') return null;

  const f = await Fundraiser.findById(tx.listingId)
    .select('title imageUrl goalAmount price state approved')
    .lean<{ title: string; imageUrl?: string; goalAmount?: number; price?: number; state: string; approved?: boolean }>();
  if (!f || (f.state === 'pulled' && f.approved === false)) return null;

  const totals = await raisedTotals([tx.listingId]);
  return {
    id,
    donor: tx.buyerWallet,
    amount: tx.amount,
    at: new Date(tx.createdAt).toISOString(),
    fundraiser: {
      id: tx.listingId,
      title: decodeEscaped(f.title),
      imageUrl: f.imageUrl,
      goal: f.goalAmount || f.price || 0,
      raised: totals.get(tx.listingId)?.raised ?? 0,
    },
  };
}
