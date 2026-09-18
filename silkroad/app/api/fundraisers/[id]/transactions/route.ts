import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import type { LeanTransaction } from '@/types/database';

/** GET — a campaign's verified donations, newest first. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ transactions: [] });
  try {
    await connectDB();
    const rows = await Transaction.find({ listingId: id, status: 'success' })
      .select('buyerWallet amount createdAt txnHash network currency')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean<LeanTransaction[]>();

    return NextResponse.json({
      transactions: rows.map((t) => ({
        _id: t._id.toString(),
        wallet: t.buyerWallet,
        amount: t.amount,
        createdAt: t.createdAt,
        txnHash: t.txnHash,
        // Legacy donations predate these fields: they were USDC on Solana.
        network: t.network ?? 'solana',
        currency: t.currency ?? 'USDC',
      })),
    });
  } catch (error) {
    console.error('Transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}
