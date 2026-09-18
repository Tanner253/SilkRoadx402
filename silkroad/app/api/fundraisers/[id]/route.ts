import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';
import { raisedTotals, presentFundraiser } from '@/lib/fundraiserTotals';
import { manageTokenFrom, manageTokenMatches } from '@/lib/manageToken';
import { isAdminRequest } from '@/lib/adminAuth';
import { createLog, getIpFromRequest } from '@/lib/logger';

type Params = { params: Promise<{ id: string }> };

/** Loads the campaign with its token hash so ownership can be checked. */
async function loadWithOwnership(req: NextRequest, id: string) {
  const fundraiser = await Fundraiser.findById(id).select('+manageTokenHash');
  if (!fundraiser) return { fundraiser: null, canManage: false };
  const canManage = isAdminRequest(req) || manageTokenMatches(manageTokenFrom(req), fundraiser.manageTokenHash);
  return { fundraiser, canManage };
}

/**
 * GET — public campaign data. If an x-manage-token header is sent, the
 * response also says whether it grants management (`canManage`).
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });
    }

    await connectDB();
    const { fundraiser, canManage } = await loadWithOwnership(req, id);
    if (!fundraiser) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });
    // Removed by moderators: gone for the public, still visible to its manager.
    if (fundraiser.state === 'pulled' && fundraiser.approved === false && !canManage) {
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });
    }

    const totals = (await raisedTotals([id])).get(id);
    return NextResponse.json({
      success: true,
      canManage,
      fundraiser: presentFundraiser({
        ...fundraiser.toObject(),
        raisedAmount: totals?.raised ?? 0,
        donationCount: totals?.donations ?? 0,
      }),
    });
  } catch (error) {
    console.error('Get fundraiser error:', error);
    return NextResponse.json({ error: 'Failed to fetch fundraiser' }, { status: 500 });
  }
}

/**
 * PATCH — pause or resume. Body: { state: 'pulled' | 'on_market' }.
 * Needs the campaign's manage token (or an admin session). There is no
 * review queue, so resuming puts the campaign straight back live.
 *
 * Creator pauses and moderator removals both use state 'pulled'; they are
 * told apart by `approved`. An admin reject sets approved: false, and only an
 * admin can bring such a campaign back — a creator can't undo moderation.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    if (body.state !== 'pulled' && body.state !== 'on_market') {
      return NextResponse.json({ error: 'state must be "pulled" (pause) or "on_market" (resume)' }, { status: 400 });
    }

    await connectDB();
    const { fundraiser, canManage } = await loadWithOwnership(req, id);
    if (!fundraiser) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });
    if (!canManage) return NextResponse.json({ error: 'This needs the campaign’s manage link.' }, { status: 403 });

    const admin = isAdminRequest(req);
    if (body.state === 'on_market' && fundraiser.approved === false && !admin) {
      return NextResponse.json(
        { error: 'This campaign was removed by moderators and can’t be resumed.' },
        { status: 403 },
      );
    }

    fundraiser.state = body.state;
    if (admin && body.state === 'on_market') fundraiser.approved = true;
    await fundraiser.save();

    await createLog(
      'fundraiser_updated',
      `Fundraiser "${fundraiser.title}" ${body.state === 'pulled' ? 'paused' : 'resumed'}`,
      fundraiser.wallet,
      getIpFromRequest(req),
    );

    return NextResponse.json({ success: true, state: fundraiser.state });
  } catch (error) {
    console.error('Update fundraiser error:', error);
    return NextResponse.json({ error: 'Failed to update fundraiser' }, { status: 500 });
  }
}

/** DELETE — remove the campaign. Needs the manage token or an admin session. */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });

    await connectDB();
    const { fundraiser, canManage } = await loadWithOwnership(req, id);
    if (!fundraiser) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });
    if (!canManage) return NextResponse.json({ error: 'This needs the campaign’s manage link.' }, { status: 403 });

    await fundraiser.deleteOne();
    await createLog('fundraiser_deleted', `Fundraiser "${fundraiser.title}" deleted`, fundraiser.wallet, getIpFromRequest(req));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete fundraiser error:', error);
    return NextResponse.json({ error: 'Failed to delete fundraiser' }, { status: 500 });
  }
}
