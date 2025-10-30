import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { safeDecrypt } from '@/lib/crypto/encryption';

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

      // Decrypt delivery URL before sending to client
      // safeDecrypt handles legacy unencrypted data without errors
      const decryptedUrl = safeDecrypt(transaction.deliveryUrl);

      return NextResponse.json({
        success: true,
        transaction: {
          ...transaction,
          deliveryUrl: decryptedUrl,
        },
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

    // Decrypt delivery URL
    // safeDecrypt handles legacy unencrypted data without errors
    const decryptedUrl = safeDecrypt(transaction.deliveryUrl);

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction.toObject(),
        deliveryUrl: decryptedUrl,
      },
    });
  } catch (error: any) {
    console.error('Get delivery error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery information' },
      { status: 500 }
    );
  }
}

