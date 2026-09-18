/** GET /api/admin/reports[?fundraiserId=] — reports, newest first. */

import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';
import { Report } from '@/models/Report';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const fundraiserId = req.nextUrl.searchParams.get('fundraiserId');
  if (fundraiserId && !isValidObjectId(fundraiserId)) return NextResponse.json({ reports: [] });

  try {
    await connectDB();
    const reports = await Report.find(fundraiserId ? { listingId: fundraiserId } : {})
      .sort({ createdAt: -1 })
      .limit(200)
      .select('listingId reason createdAt')
      .lean();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}
