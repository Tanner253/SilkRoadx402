import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';

/** POST — count a page view. Best-effort: never fails the page. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ success: false }, { status: 404 });
  try {
    await connectDB();
    await Fundraiser.updateOne({ _id: id }, { $inc: { views: 1 } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('View count error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
