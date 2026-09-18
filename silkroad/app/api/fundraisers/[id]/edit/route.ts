/**
 * PUT /api/fundraisers/[id]/edit — update a campaign's story and details.
 *
 * Authorised by the campaign's manage token (x-manage-token) or an admin
 * session. Edits apply immediately; there is no re-review.
 *
 * The payout address is deliberately NOT editable: if a manage link ever
 * leaked, being able to change where donations go would let whoever holds it
 * redirect the campaign's money. A creator who needs a new address starts a
 * new campaign.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { FUNDRAISER_CATEGORIES } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';
import { plainText } from '@/lib/validation/sanitization';
import { presentFundraiser } from '@/lib/fundraiserTotals';
import { normalizeLinks } from '@/lib/links';
import { manageTokenFrom, manageTokenMatches } from '@/lib/manageToken';
import { isAdminRequest } from '@/lib/adminAuth';
import { createLog, getIpFromRequest } from '@/lib/logger';

function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    await connectDB();
    const fundraiser = await Fundraiser.findById(id).select('+manageTokenHash');
    if (!fundraiser) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });
    if (!isAdminRequest(req) && !manageTokenMatches(manageTokenFrom(req), fundraiser.manageTokenHash)) {
      return NextResponse.json({ error: 'This needs the campaign’s manage link.' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 5 || body.title.trim().length > 100) {
        return NextResponse.json({ error: 'Title must be 5–100 characters.' }, { status: 400 });
      }
      updates.title = plainText(body.title);
    }
    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim().length < 50 || body.description.trim().length > 2000) {
        return NextResponse.json({ error: 'Story must be 50–2000 characters.' }, { status: 400 });
      }
      updates.description = plainText(body.description);
    }
    if (body.category !== undefined) {
      if (!(FUNDRAISER_CATEGORIES as readonly string[]).includes(body.category)) {
        return NextResponse.json({ error: 'Choose a category.' }, { status: 400 });
      }
      updates.category = body.category;
    }
    if (body.goal !== undefined) {
      const goal = Number(body.goal);
      const max = fundraiser.currency === 'ETH' ? 10_000 : 1_000_000;
      if (!Number.isFinite(goal) || goal <= 0 || goal > max) {
        return NextResponse.json({ error: `Goal must be between 0 and ${max.toLocaleString()} ${fundraiser.currency ?? 'USDC'}.` }, { status: 400 });
      }
      updates.goalAmount = goal;
      updates.price = goal;
    }
    const cleared: Record<string, ''> = {};
    if (body.imageUrl !== undefined) {
      const image = httpsUrl(body.imageUrl);
      if (!image) return NextResponse.json({ error: 'The cover image must be an https URL.' }, { status: 400 });
      updates.imageUrl = image;
    }
    if (body.links !== undefined) {
      const links = normalizeLinks(body.links);
      if ('error' in links) return NextResponse.json({ error: links.error }, { status: 400 });
      updates.links = links.links;
      // Legacy single-purpose fields now live in `links`; clear them so they
      // don't reappear after the creator removes them.
      Object.assign(cleared, { demoVideoUrl: '', whitepaperUrl: '', githubUrl: '' });
    }

    if (!Object.keys(updates).length && !Object.keys(cleared).length) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    const updated = await Fundraiser.findByIdAndUpdate(
      id,
      { ...(Object.keys(updates).length && { $set: updates }), ...(Object.keys(cleared).length && { $unset: cleared }) },
      { new: true },
    ).lean();
    await createLog('fundraiser_updated', `Fundraiser "${fundraiser.title}" edited`, fundraiser.wallet, getIpFromRequest(req));

    return NextResponse.json({ success: true, fundraiser: presentFundraiser(updated ?? {}) });
  } catch (error) {
    console.error('Edit fundraiser error:', error);
    return NextResponse.json({ error: 'Failed to update fundraiser' }, { status: 500 });
  }
}
