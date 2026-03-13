/**
 * Agent Payment API — Pump.fun Tokenized Agent Integration
 *
 * Two actions via query param ?action=build|verify
 *   build  → builds an unsigned tx for the client to sign
 *   verify → confirms the invoice was paid on-chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { PumpAgent } from '@pump-fun/agent-payments-sdk';
import { CONFIG } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Transaction as TxModel } from '@/models/Transaction';
import { Fundraiser } from '@/models/Fundraiser';
import { createLog, getIpFromRequest } from '@/lib/logger';

function getAgent(withConnection = false) {
  const mint = new PublicKey(CONFIG.AGENT_TOKEN_MINT);
  if (withConnection) {
    const connection = new Connection(CONFIG.SOLANA_RPC_URL, 'confirmed');
    return new PumpAgent(mint, 'mainnet', connection);
  }
  return new PumpAgent(mint);
}

function generateInvoiceParams(amount: string) {
  const memo = String(Math.floor(Math.random() * 900000000000) + 100000);
  const now = Math.floor(Date.now() / 1000);
  return {
    amount,
    memo,
    startTime: String(now),
    endTime: String(now + 86400), // 24h window
  };
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  if (!CONFIG.AGENT_TOKEN_MINT) {
    return NextResponse.json(
      { error: 'Agent token not configured' },
      { status: 503 }
    );
  }

  if (action === 'build') {
    return handleBuild(req);
  }
  if (action === 'verify') {
    return handleVerify(req);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function handleBuild(req: NextRequest) {
  try {
    const { fundraiserId, userWallet, donationAmount } = await req.json();

    if (!fundraiserId || !userWallet || !donationAmount) {
      return NextResponse.json(
        { error: 'Missing fundraiserId, userWallet, or donationAmount' },
        { status: 400 }
      );
    }

    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount < 0.10) {
      return NextResponse.json(
        { error: 'Minimum donation is $0.10' },
        { status: 400 }
      );
    }

    // USDC has 6 decimals
    const amountSmallest = String(Math.floor(amount * 1_000_000));
    const invoiceParams = generateInvoiceParams(amountSmallest);

    const connection = new Connection(CONFIG.SOLANA_RPC_URL, 'confirmed');
    const agent = getAgent(true);
    const userPubkey = new PublicKey(userWallet);
    const currencyMint = new PublicKey(CONFIG.AGENT_CURRENCY_MINT);

    const instructions = await agent.buildAcceptPaymentInstructions({
      user: userPubkey,
      currencyMint,
      amount: invoiceParams.amount,
      memo: invoiceParams.memo,
      startTime: invoiceParams.startTime,
      endTime: invoiceParams.endTime,
    });

    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = userPubkey;
    tx.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
      ...instructions,
    );

    const serializedTx = tx
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    return NextResponse.json({
      transaction: serializedTx,
      invoiceParams: {
        ...invoiceParams,
        currencyMint: CONFIG.AGENT_CURRENCY_MINT,
        userWallet,
      },
      fundraiserId,
      donationAmount: amount,
    });
  } catch (error: any) {
    console.error('Agent payment build error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build agent payment' },
      { status: 500 }
    );
  }
}

async function handleVerify(req: NextRequest) {
  try {
    const {
      fundraiserId,
      userWallet,
      donationAmount,
      invoiceParams,
      txSignature,
    } = await req.json();

    if (!fundraiserId || !userWallet || !invoiceParams) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const agent = getAgent(true);
    const currencyMint = new PublicKey(invoiceParams.currencyMint);

    // Retry verification (tx may take a few seconds to land)
    let paid = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      paid = await agent.validateInvoicePayment({
        user: new PublicKey(userWallet),
        currencyMint,
        amount: Number(invoiceParams.amount),
        memo: Number(invoiceParams.memo),
        startTime: Number(invoiceParams.startTime),
        endTime: Number(invoiceParams.endTime),
      });
      if (paid) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!paid) {
      return NextResponse.json(
        { error: 'Payment not verified on-chain' },
        { status: 402 }
      );
    }

    // Payment confirmed — record in DB
    await connectDB();

    const fundraiser = await Fundraiser.findById(fundraiserId);
    if (!fundraiser) {
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });
    }

    const amount = parseFloat(donationAmount);

    const newTransaction = await TxModel.create({
      listingId: fundraiserId,
      buyerWallet: userWallet,
      sellerWallet: fundraiser.wallet,
      amount,
      txnHash: txSignature || `agent-${invoiceParams.memo}`,
      deliveryUrl: fundraiser.deliveryUrl,
      status: 'success',
    });

    await Fundraiser.findByIdAndUpdate(fundraiserId, {
      $inc: { raisedAmount: amount },
    });

    await createLog(
      'fundraiser_donated',
      `Agent payment: $${amount} to "${fundraiser.title}" via Pump agent`,
      userWallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      transactionId: newTransaction._id.toString(),
      txHash: txSignature || `agent-${invoiceParams.memo}`,
    });
  } catch (error: any) {
    console.error('Agent payment verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
