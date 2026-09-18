/**
 * "N online" counter.
 *   GET  → { activeUsers }: sessions seen in the last 5 minutes (TTL index)
 *   POST { sessionId, page } → heartbeat
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ActiveSession } from '@/models/ActiveSession';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ success: true, activeUsers: await ActiveSession.countDocuments() });
  } catch (error) {
    console.error('Active users count error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { sessionId, page } = await req.json().catch(() => ({}));
  // Older builds generated ids like sess_1789704550355_f11bga, so allow underscores.
  if (typeof sessionId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(sessionId)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  try {
    await connectDB();
    await ActiveSession.updateOne(
      { sessionId },
      { $set: { lastSeen: new Date(), page: typeof page === 'string' ? page.slice(0, 200) : '/' } },
      { upsert: true },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Active users heartbeat error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
