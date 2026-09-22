/**
 * GET /api/donations/recent — the latest verified donations across live
 * campaigns, for the donation ticker. Only what's already public on-chain:
 * donor address, amount, time, and which campaign it went to.
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Fundraiser } from '@/models/Fundraiser';
import { decodeEscaped } from '@/lib/validation/sanitization';
import type { Types } from 'mongoose';

const LIMIT = 12;

export async function GET() {
  try {
    await connectDB();
    const recent = await Transaction.find({ status: 'success', network: 'robinhood', currency: 'ETH' })
      .sort({ createdAt: -1 })
      .limit(LIMIT * 3) // headroom for donations to paused or removed campaigns
      .select('listingId buyerWallet amount createdAt')
      .lean<{ listingId: string; buyerWallet: string; amount: number; createdAt: Date }[]>();

    const live = await Fundraiser.find({ _id: { $in: [...new Set(recent.map((t) => t.listingId))] }, state: { $ne: 'pulled' } })
      .select('title')
      .lean<{ _id: Types.ObjectId; title: string }[]>();
    const titles = new Map(live.map((f) => [f._id.toString(), decodeEscaped(f.title)]));

    const donations = recent
      .filter((t) => titles.has(t.listingId))
      .slice(0, LIMIT)
      .map((t) => ({
        donor: t.buyerWallet,
        amount: t.amount,
        at: t.createdAt,
        fundraiserId: t.listingId,
        fundraiserTitle: titles.get(t.listingId),
      }));

    return NextResponse.json(
      { success: true, donations },
      { headers: { 'cache-control': 'public, s-maxage=15, stale-while-revalidate=30' } },
    );
  } catch (error) {
    console.error('Recent donations error:', error);
    return NextResponse.json({ error: 'Failed to load recent donations' }, { status: 500 });
  }
}
