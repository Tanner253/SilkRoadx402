/**
 * Donation watches for this browser (ids live in an httpOnly cookie).
 *   GET              → the watches, no chain calls
 *   POST  { fundraiserId, donorAddress } → start (or reuse) a watch
 *   DELETE ?id=…     → stop showing a watch in this browser
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { DonationWatch } from '@/models/DonationWatch';
import { checkRateLimit } from '@/lib/rateLimit';
import { getIpFromRequest } from '@/lib/logger';
import { registerWatch, viewWatches, WatchError } from '@/lib/donationWatch';
import { setWatchIds, watchIdsFrom } from '@/lib/watchCookie';

const REGISTER_LIMIT = {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000,
  keyPrefix: 'watch-register',
  message: 'Too many donation registrations from this connection. Try again later.',
};

export async function GET(req: NextRequest) {
  const ids = watchIdsFrom(req);
  if (!ids.length) return NextResponse.json({ watches: [] });
  try {
    await connectDB();
    const watches = await DonationWatch.find({ _id: { $in: ids } }).sort({ createdAt: -1 });
    return NextResponse.json({ watches: await viewWatches(watches) });
  } catch (error) {
    console.error('List watches error:', error);
    return NextResponse.json({ error: 'Failed to load your donations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fundraiserId, donorAddress } = await req.json().catch(() => ({}));
    if (!isValidObjectId(fundraiserId)) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    await connectDB();
    const rate = await checkRateLimit(getIpFromRequest(req) || 'unknown', REGISTER_LIMIT);
    if (!rate.allowed) return NextResponse.json({ error: rate.message }, { status: 429 });

    const { watch } = await registerWatch(fundraiserId, donorAddress);
    const [view] = await viewWatches([watch]);
    const res = NextResponse.json({ watch: view }, { status: 201 });
    setWatchIds(res, [...watchIdsFrom(req), watch._id.toString()]);
    return res;
  } catch (error) {
    if (error instanceof WatchError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Register watch error:', error);
    return NextResponse.json({ error: 'Couldn’t start watching for your donation. Please try again.' }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const res = NextResponse.json({ success: true });
  setWatchIds(res, watchIdsFrom(req).filter((w) => w !== id));
  return res;
}
