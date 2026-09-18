/**
 * Words of support on a campaign.
 *   GET  → comments, newest first
 *   POST { comment } → only from a verified donor: this browser's watch
 *        cookie must hold a watch for this campaign that found a donation.
 *        The comment is attributed to that donor's wallet. One per donor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Comment } from '@/models/Comment';
import { DonationWatch } from '@/models/DonationWatch';
import { plainText, decodeEscaped } from '@/lib/validation/sanitization';
import { watchIdsFrom } from '@/lib/watchCookie';
import { isDuplicateKeyError } from '@/lib/errors';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ comments: [] });
  try {
    await connectDB();
    const comments = await Comment.find({ listingId: id }).sort({ createdAt: -1 }).limit(200).lean<{ comment: string }[]>();
    return NextResponse.json({ comments: comments.map((c) => ({ ...c, comment: decodeEscaped(c.comment) })) });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  const { comment } = await req.json().catch(() => ({}));
  const text = typeof comment === 'string' ? plainText(comment) : '';
  if (text.length < 2 || text.length > 500) {
    return NextResponse.json({ error: 'Comments must be 2–500 characters.' }, { status: 400 });
  }

  try {
    await connectDB();
    const watch = await DonationWatch.findOne({
      _id: { $in: watchIdsFrom(req) },
      fundraiserId: id,
      status: 'found',
    }).select('donor');
    if (!watch) {
      return NextResponse.json({ error: 'Only donors can comment, once their donation has been counted.' }, { status: 403 });
    }

    if (await Comment.exists({ listingId: id, buyerWallet: watch.donor })) {
      return NextResponse.json({ error: 'You’ve already left a comment on this campaign.' }, { status: 409 });
    }
    try {
      const created = await Comment.create({ listingId: id, buyerWallet: watch.donor, comment: text });
      return NextResponse.json({ comment: created }, { status: 201 });
    } catch (err) {
      if (isDuplicateKeyError(err)) return NextResponse.json({ error: 'You’ve already left a comment on this campaign.' }, { status: 409 });
      throw err;
    }
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
