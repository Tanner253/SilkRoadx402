import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Fetching delivery for transaction ${id}`);
      
      const transaction = mockStore.getTransaction(id);
      if (!transaction) {
        console.error(`❌ Transaction ${id} not found in mockStore`);
        console.log(`   Available transactions:`, mockStore.getAllTransactions().map(t => t._id));
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      console.log(`✅ Found transaction ${id}`);
      console.log(`   Buyer: ${transaction.buyerWallet.slice(0, 8)}...`);
      console.log(`   Delivery URL: ${transaction.deliveryUrl}`);

      return NextResponse.json({
        success: true,
        transaction,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Decrypt delivery URL (in real implementation)
    // const decryptedUrl = decrypt(transaction.deliveryUrl);

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    console.error('Get delivery error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery information' },
      { status: 500 }
    );
  }
}

