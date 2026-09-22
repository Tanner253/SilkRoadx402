import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { FUNDRAISER_CATEGORIES } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';
import { plainText } from '@/lib/validation/sanitization';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';
import { normalizeAddress } from '@/lib/chain/robinhood';
import { createManageToken } from '@/lib/manageToken';
import { raisedTotals, presentFundraiser } from '@/lib/fundraiserTotals';
import { normalizeLinks } from '@/lib/links';
import type { LeanFundraiser } from '@/types/database';

const MAX_GOAL_ETH = 10_000;

/**
 * GET /api/fundraisers
 *   (no params)    every live campaign — anything not pulled. There is no
 *                  approval queue any more; campaigns go live on creation.
 *   ?ids=a,b,c     those campaigns in any state (used by "My fundraisers",
 *                  which knows its ids from locally stored manage links)
 *   ?wallet=0x…    live campaigns paying out to that address
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = (searchParams.get('ids') || '').split(',').map(s => s.trim()).filter(isValidObjectId).slice(0, 50);
    const wallet = searchParams.get('wallet');

    await connectDB();

    const filter = ids.length
      ? { _id: { $in: ids } }
      : wallet
        ? { wallet: normalizeAddress(wallet) ?? wallet, state: { $ne: 'pulled' } }
        : { state: { $ne: 'pulled' } };

    const docs = await Fundraiser.find(filter).select('-deliveryUrl').lean<LeanFundraiser[]>();
    const totals = await raisedTotals(docs.map(d => d._id.toString()));

    const fundraisers = docs
      .map(d => {
        const t = totals.get(d._id.toString());
        return presentFundraiser({ ...d, raisedAmount: t?.raised ?? 0, donationCount: t?.donations ?? 0, giftsToday: t?.giftsToday ?? 0, lastGiftAt: t?.lastGiftAt ?? null });
      })
      // Pinned first (newest pin first), then newest campaigns.
      .sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        const at = new Date((a.pinned ? a.pinnedAt : a.createdAt) ?? 0).getTime();
        const bt = new Date((b.pinned ? b.pinnedAt : b.createdAt) ?? 0).getTime();
        return bt - at;
      });

    return NextResponse.json({ success: true, fundraisers });
  } catch (error) {
    console.error('Get fundraisers error:', error);
    return NextResponse.json({ error: 'Failed to fetch fundraisers' }, { status: 500 });
  }
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/fundraisers — create a campaign. No wallet connection, no
 * account, no review: it goes live immediately. The response carries a
 * one-time manage token; only its hash is stored.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const { title, description, category, imageUrl, goal, payoutAddress } = body;

    const address = normalizeAddress(payoutAddress);
    if (!address) {
      return NextResponse.json({ error: 'Enter a valid wallet address (0x…) to receive donations.' }, { status: 400 });
    }
    if (typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 100) {
      return NextResponse.json({ error: 'Title must be 5–100 characters.' }, { status: 400 });
    }
    if (typeof description !== 'string' || description.trim().length < 50 || description.trim().length > 2000) {
      return NextResponse.json({ error: 'Story must be 50–2000 characters.' }, { status: 400 });
    }
    if (!(FUNDRAISER_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'Choose a category.' }, { status: 400 });
    }
    const goalEth = Number(goal);
    if (!Number.isFinite(goalEth) || goalEth <= 0 || goalEth > MAX_GOAL_ETH) {
      return NextResponse.json({ error: `Goal must be between 0 and ${MAX_GOAL_ETH.toLocaleString()} ETH.` }, { status: 400 });
    }
    const image = httpsUrl(imageUrl);
    if (!image) return NextResponse.json({ error: 'Add a cover image.' }, { status: 400 });
    const links = normalizeLinks(body.links);
    if ('error' in links) return NextResponse.json({ error: links.error }, { status: 400 });

    await connectDB();

    // Without accounts the requester's IP is the only spam handle we have.
    const ip = getIpFromRequest(req) || 'unknown';
    const rate = await checkRateLimit(ip, RATE_LIMITS.CREATE_FUNDRAISER);
    if (!rate.allowed) {
      return NextResponse.json({ error: rate.message, resetAt: rate.resetAt }, { status: 429 });
    }

    const { token, hash } = createManageToken();
    const fundraiser = await Fundraiser.create({
      wallet: address,
      title: plainText(title),
      description: plainText(description),
      category,
      imageUrl: image,
      links: links.links,
      goalAmount: goalEth,
      price: goalEth, // legacy field some views still read
      raisedAmount: 0,
      network: 'robinhood',
      currency: 'ETH',
      manageTokenHash: hash,
      riskLevel: 'standard',
      state: 'on_market',
      approved: true,
    });

    await createLog(
      'fundraiser_created',
      `New fundraiser live: "${fundraiser.title}" (goal ${goalEth} ETH) paying ${address}`,
      address,
      ip,
    );

    return NextResponse.json(
      { success: true, fundraiser: presentFundraiser(fundraiser.toObject()), manageToken: token },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create fundraiser error:', error);
    return NextResponse.json({ error: 'Failed to create fundraiser' }, { status: 500 });
  }
}
