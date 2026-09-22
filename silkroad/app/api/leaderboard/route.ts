import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Fundraiser } from '@/models/Fundraiser';
import type { Types } from 'mongoose';

interface RankRow {
  _id: string;
  totalRaised: number;
  donationCount: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10') || 10, 1), 50);

    await connectDB();

    // Only donations to fundraisers — not old marketplace purchases.
    // Transaction.listingId is a string; Fundraiser._id is an ObjectId.
    const fundraiserIds = (await Fundraiser.find({}, { _id: 1 }).lean<{ _id: Types.ObjectId }[]>()).map((f) => f._id.toString());

    // ETH (Robinhood Chain) and USDC (Solana, before the move) are different
    // units, so they're ranked separately rather than summed together.
    const rank = (currencyMatch: object) =>
      Transaction.aggregate<RankRow>([
        { $match: { status: 'success', listingId: { $in: fundraiserIds }, ...currencyMatch } },
        { $group: { _id: '$sellerWallet', totalRaised: { $sum: '$amount' }, donationCount: { $sum: 1 } } },
        { $sort: { totalRaised: -1 } },
        { $limit: limit },
      ]);

    const [eth, usdc] = await Promise.all([
      rank({ currency: 'ETH' }),
      rank({ $or: [{ currency: 'USDC' }, { currency: { $exists: false } }] }),
    ]);

    const enrich = (rows: RankRow[], currency: 'ETH' | 'USDC') =>
      Promise.all(
        rows.map(async (row) => ({
          wallet: row._id,
          totalRaised: row.totalRaised,
          donationCount: row.donationCount,
          currency,
          activeCampaigns: await Fundraiser.countDocuments({ wallet: row._id, state: { $ne: 'pulled' } }),
        })),
      );

    // Donors: the wallets that gave the most, across every campaign.
    const donorRows = Transaction.aggregate<{ _id: string; totalGiven: number; donationCount: number; campaignCount: number; lastAt: Date }>([
      { $match: { status: 'success', currency: 'ETH', listingId: { $in: fundraiserIds } } },
      {
        $group: {
          _id: '$buyerWallet',
          totalGiven: { $sum: '$amount' },
          donationCount: { $sum: 1 },
          campaigns: { $addToSet: '$listingId' },
          lastAt: { $max: '$createdAt' },
        },
      },
      { $project: { totalGiven: 1, donationCount: 1, lastAt: 1, campaignCount: { $size: '$campaigns' } } },
      { $sort: { totalGiven: -1, lastAt: 1 } },
      { $limit: limit },
    ]);

    const [leaderboard, legacy, donors] = await Promise.all([enrich(eth, 'ETH'), enrich(usdc, 'USDC'), donorRows]);

    return NextResponse.json({
      success: true,
      leaderboard,
      legacy,
      donors: donors.map((d) => ({
        wallet: d._id,
        totalGiven: d.totalGiven,
        donationCount: d.donationCount,
        campaignCount: d.campaignCount,
        lastAt: d.lastAt,
      })),
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
