/**
 * POST /api/donation-watch/check — check this browser's open watches against
 * the chain. Safe to poll: each watch is re-checked at most once per
 * CHECK_INTERVAL_MS server-side, however often this is called.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DonationWatch } from '@/models/DonationWatch';
import { checkWatch, viewWatches } from '@/lib/donationWatch';
import { watchIdsFrom } from '@/lib/watchCookie';

const MAX_PER_REQUEST = 3;
/** Total chain time per request — well inside the 10 s serverless limit. */
const REQUEST_BUDGET_MS = 7_000;

export async function POST(req: NextRequest) {
  const deadline = Date.now() + REQUEST_BUDGET_MS;
  const ids = watchIdsFrom(req);
  if (!ids.length) return NextResponse.json({ watches: [] });

  try {
    await connectDB();
    // At most MAX_PER_REQUEST per call, least-recently-checked first, so a
    // request stays well inside the serverless time limit; the rest are
    // picked up on the next poll.
    const open = await DonationWatch.find({ _id: { $in: ids }, status: { $in: ['watching', 'needs_archive'] } })
      .sort({ lastCheckedAt: 1 })
      .limit(MAX_PER_REQUEST)
      .select('_id');
    // Sequential on purpose: keeps the burst on the shared RPC small.
    for (const w of open) {
      // Leave any remaining watches for the next poll rather than overrun.
      if (Date.now() > deadline - 1_000) break;
      try {
        await checkWatch(w._id.toString(), undefined, deadline);
      } catch (err) {
        console.error('Watch check failed', w._id.toString(), err);
      }
    }
    const watches = await DonationWatch.find({ _id: { $in: ids } }).sort({ createdAt: -1 });
    return NextResponse.json({ watches: await viewWatches(watches) });
  } catch (error) {
    console.error('Check watches error:', error);
    return NextResponse.json({ error: 'Couldn’t check right now' }, { status: 502 });
  }
}
