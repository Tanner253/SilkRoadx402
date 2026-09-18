/**
 * PATCH /api/admin/fundraisers/[id] — moderation.
 *   { action: 'remove' }   hide it and stop donations (approved: false, so the
 *                          creator can't resume it with their manage link)
 *   { action: 'restore' }  put it back live
 *   { action: 'pin' | 'unpin' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';
import { Fundraiser } from '@/models/Fundraiser';
import { createLog, getIpFromRequest } from '@/lib/logger';

const ACTIONS = ['remove', 'restore', 'pin', 'unpin'] as const;
type Action = (typeof ACTIONS)[number];

function updateFor(action: Action) {
  switch (action) {
    case 'remove':
      return { state: 'pulled', approved: false };
    case 'restore':
      return { state: 'on_market', approved: true };
    case 'pin':
      return { pinned: true, pinnedAt: new Date() };
    case 'unpin':
      return { pinned: false };
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });

  const { action } = await req.json().catch(() => ({}));
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'action must be remove, restore, pin or unpin' }, { status: 400 });
  }
  const update = updateFor(action);

  try {
    await connectDB();
    const fundraiser = await Fundraiser.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!fundraiser) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });

    await createLog('admin_action', `Admin ${action}: "${fundraiser.title}" (${id})`, undefined, getIpFromRequest(req));
    return NextResponse.json({ success: true, state: fundraiser.state, pinned: fundraiser.pinned });
  } catch (error) {
    console.error('Admin moderation error:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}
