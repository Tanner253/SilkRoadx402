/**
 * POST /api/coin — prefill a campaign from a coin's contract address.
 * Body: { address }. Reads the coin's on-chain profile and, if it has a
 * logo, turns it into a 16:9 cover. Nothing is saved to the database; the
 * creator reviews and edits everything before publishing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { normalizeAddress } from '@/lib/chain/network';
import { CoinNotFoundError, readCoin } from '@/lib/chain/coin';
import { uploadCover } from '@/lib/cloudinary';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { getIpFromRequest } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const address = normalizeAddress(body?.address);
  if (!address) return NextResponse.json({ error: 'Enter the coin’s contract address (0x…).' }, { status: 400 });

  const rate = await checkRateLimit(getIpFromRequest(req) || 'unknown', RATE_LIMITS.COIN_IMPORT);
  if (!rate.allowed) return NextResponse.json({ error: rate.message }, { status: 429 });

  try {
    const coin = await readCoin(address);

    // The cover is a nice-to-have: if the logo can't be fetched the creator
    // just uploads one themselves.
    let imageUrl: string | null = null;
    for (const logo of coin.logos) {
      imageUrl = await uploadCover(logo, 'letterbox').catch((error) => {
        console.warn('Coin logo upload failed:', logo, error?.message ?? error);
        return null;
      });
      if (imageUrl) break;
    }

    return NextResponse.json({
      success: true,
      coin: { address: coin.address, name: coin.name, symbol: coin.symbol, description: coin.description, links: coin.links, imageUrl },
    });
  } catch (error) {
    if (error instanceof CoinNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error('Coin import error:', error);
    return NextResponse.json({ error: 'Couldn’t read that coin right now. Try again in a moment.' }, { status: 502 });
  }
}
