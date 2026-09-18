/** GET /api/admin/fundraisers — every campaign in any state, with report counts. */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';
import { Fundraiser } from '@/models/Fundraiser';
import { Report } from '@/models/Report';
import { raisedTotals, presentFundraiser } from '@/lib/fundraiserTotals';
import type { LeanFundraiser } from '@/types/database';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const docs = await Fundraiser.find({}).sort({ createdAt: -1 }).lean<LeanFundraiser[]>();
    const ids = docs.map((d) => d._id.toString());
    const [totals, reportRows] = await Promise.all([
      raisedTotals(ids),
      Report.aggregate<{ _id: string; count: number }>([
        { $match: { listingId: { $in: ids } } },
        { $group: { _id: '$listingId', count: { $sum: 1 } } },
      ]),
    ]);
    const reports = new Map(reportRows.map((r) => [r._id, r.count]));

    return NextResponse.json({
      fundraisers: docs.map((d) => {
        const id = d._id.toString();
        return {
          ...presentFundraiser(d),
          approved: d.approved,
          raisedAmount: totals.get(id)?.raised ?? 0,
          donationCount: totals.get(id)?.donations ?? 0,
          reports: reports.get(id) ?? 0,
        };
      }),
    });
  } catch (error) {
    console.error('Admin fundraisers error:', error);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }
}
