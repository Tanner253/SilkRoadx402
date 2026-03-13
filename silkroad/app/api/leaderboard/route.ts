import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Fundraiser } from '@/models/Fundraiser';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      // Mock data only contains old marketplace transactions — return empty leaderboard
      return NextResponse.json({ success: true, leaderboard: [], _mock: true });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Get all fundraiser IDs so we can filter to donations only (not old marketplace purchases)
    // Transaction.listingId is stored as a plain string, Fundraiser._id is ObjectId — convert
    const fundraiserDocs = await Fundraiser.find({}, { _id: 1 }).lean();
    const fundraiserIds = fundraiserDocs.map((f: any) => f._id.toString());

    // Aggregate only transactions whose listingId belongs to a fundraiser
    const creatorRevenue = await Transaction.aggregate([
      { $match: { status: 'success', listingId: { $in: fundraiserIds } } },
      {
        $group: {
          _id: '$sellerWallet',
          totalRaised: { $sum: '$amount' },
          donationCount: { $sum: 1 },
        },
      },
      { $sort: { totalRaised: -1 } },
      { $limit: limit },
    ]);

    // Enrich with active campaign count from Fundraiser model
    const leaderboard = await Promise.all(
      creatorRevenue.map(async (creator) => {
        const activeCampaigns = await Fundraiser.countDocuments({
          wallet: creator._id,
          state: 'on_market',
          approved: true,
        });
        return {
          wallet: creator._id,
          totalRaised: creator.totalRaised,
          donationCount: creator.donationCount,
          activeCampaigns,
        };
      })
    );

    return NextResponse.json({ success: true, leaderboard });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
