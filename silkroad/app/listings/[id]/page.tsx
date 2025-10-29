'use client';

import { use, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ProtectedContent } from '@/components/auth/ProtectedContent';
import { 
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

interface Listing {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  state: string;
  approved: boolean;
  createdAt: Date;
}

function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise
  const { id } = use(params);
  
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey, signTransaction } = useWallet();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && id) {
      fetchListing();
    }
  }, [mounted, id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/listings/${id}`);
      setListing(response.data.listing);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!publicKey || !listing) return;

    if (!isConnected || !hasAcceptedTOS) {
      alert('Please connect your wallet and accept TOS first');
      router.push('/');
      return;
    }

    if (!isTokenGated) {
      alert('You need ≥50k $SRx402 tokens to make purchases');
      return;
    }

    if (!signTransaction) {
      alert('Wallet does not support transaction signing');
      return;
    }

    if (confirm(`Purchase "${listing.title}" for $${listing.price.toFixed(2)} USDC?`)) {
      try {
        setPurchasing(true);
        setError(null);

        console.log('🛒 Starting x402 purchase flow...');

        // ====================================
        // STEP 1: Get 402 Payment Required
        // ====================================
        console.log('📋 Step 1: Requesting payment requirements...');
        let paymentRequired;
        
        try {
          await axios.post('/api/purchase', {
            listingId: listing._id,
          });
          // If we get here, payment wasn't required (shouldn't happen)
          throw new Error('Expected 402 Payment Required response');
        } catch (err: any) {
          if (err.response?.status === 402) {
            paymentRequired = err.response.data;
            console.log('✅ Got payment requirements:', paymentRequired);
          } else {
            throw err;
          }
        }

        // Extract payment requirements
        const requirements = paymentRequired.accepts[0];
        const amountLamports = parseInt(requirements.maxAmountRequired);
        const sellerWallet = new PublicKey(requirements.payTo);
        const usdcMint = new PublicKey(requirements.asset);
        
        console.log(`💰 Amount: ${amountLamports / 1_000_000} USDC`);
        console.log(`👤 Seller: ${sellerWallet.toBase58()}`);
        console.log(`🪙 Mint: ${usdcMint.toBase58()}`);

        // ====================================
        // STEP 2: Construct SPL Transfer
        // ====================================
        console.log('🔨 Step 2: Constructing USDC transfer transaction...');
        
        // Get RPC connection (devnet or mainnet based on requirements)
        const rpcUrl = requirements.network === 'solana-devnet' 
          ? process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com'
          : process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com';
        
        const connection = new Connection(rpcUrl, 'confirmed');

        // Get associated token accounts
        const buyerTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          publicKey
        );

        const sellerTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          sellerWallet
        );

        console.log(`📥 Buyer token account: ${buyerTokenAccount.toBase58()}`);
        console.log(`📤 Seller token account: ${sellerTokenAccount.toBase58()}`);

        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
          buyerTokenAccount,
          sellerTokenAccount,
          publicKey,
          amountLamports,
          [],
          TOKEN_PROGRAM_ID
        );

        // Create transaction
        const transaction = new Transaction().add(transferInstruction);
        transaction.feePayer = publicKey;
        
        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        console.log('✅ Transaction constructed');

        // ====================================
        // STEP 3: Sign & Broadcast
        // ====================================
        console.log('✍️  Step 3: Signing transaction with wallet...');
        
        const signed = await signTransaction(transaction);
        
        console.log('📡 Broadcasting transaction...');
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        console.log(`✅ Transaction sent! Signature: ${signature}`);
        console.log(`🔗 View: https://explorer.solana.com/tx/${signature}?cluster=${requirements.network === 'solana-devnet' ? 'devnet' : 'mainnet'}`);

        // Wait for confirmation using polling (avoid WebSocket issues)
        console.log('⏳ Waiting for confirmation...');
        
        let confirmed = false;
        const maxAttempts = 30; // 30 attempts = ~30 seconds
        
        for (let i = 0; i < maxAttempts; i++) {
          try {
            const status = await connection.getSignatureStatus(signature);
            
            if (status?.value?.confirmationStatus === 'confirmed' || 
                status?.value?.confirmationStatus === 'finalized') {
              confirmed = true;
              console.log(`✅ Transaction confirmed! (${status.value.confirmationStatus})`);
              break;
            }
            
            if (status?.value?.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }
            
            // Wait 1 second before next poll
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.warn(`Attempt ${i + 1}/${maxAttempts} - checking status...`);
          }
        }
        
        if (!confirmed) {
          console.warn('⚠️ Could not confirm transaction in time, proceeding anyway...');
          console.warn('   Backend will verify on-chain');
        }

        // ====================================
        // STEP 4: Send Payment to Backend
        // ====================================
        console.log('📨 Step 4: Sending payment proof to backend...');
        
        // Construct payment payload
        const paymentPayload = {
          x402Version: 1,
          scheme: 'exact',
          network: requirements.network,
          payload: {
            signature,
            from: publicKey.toBase58(),
            to: sellerWallet.toBase58(),
            amount: amountLamports.toString(),
            mint: usdcMint.toBase58(),
          },
        };

        // Encode to Base64
        const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

        // Send to backend with X-PAYMENT header
        const finalResponse = await axios.post(
          '/api/purchase',
          { listingId: listing._id },
          {
            headers: {
              'X-PAYMENT': paymentHeader,
            },
          }
        );

        console.log('✅ Backend response received:', finalResponse.data);

        if (finalResponse.data.success && finalResponse.data.transactionId) {
          console.log('🎉 Purchase successful! Transaction ID:', finalResponse.data.transactionId);
          
          // Redirect to delivery page to show the URL
          router.push(`/delivery/${finalResponse.data.transactionId}`);
        } else {
          console.error('❌ No transaction ID in response:', finalResponse.data);
          throw new Error('Purchase succeeded but no transaction ID received');
        }

      } catch (err: any) {
        console.error('❌ Purchase error:', err);
        
        if (err.code === 4001) {
          // User rejected signature
          setError('Transaction cancelled by user');
        } else if (err.response?.status === 402) {
          setError('Payment verification failed: ' + (err.response.data.error || 'Unknown error'));
        } else {
          setError(err.response?.data?.error || err.message || 'Purchase failed');
        }
      } finally {
        setPurchasing(false);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            {error || 'Listing Not Found'}
          </h1>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <Link
          href="/listings"
          className="mb-6 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to Browse
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
            {listing.riskLevel === 'high-risk' && (
              <div className="absolute top-4 right-4 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                ⚠️ High Risk
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 mb-3">
                {listing.category}
              </span>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                {listing.title}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Price & Purchase */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 mb-6">
              <div className="mb-4">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Price</div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  ${listing.price.toFixed(2)} USDC
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                  <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
                </div>
              )}

              {!isConnected || !hasAcceptedTOS ? (
                <Link
                  href="/"
                  className="block w-full rounded-lg bg-blue-600 py-3 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Connect Wallet to Purchase
                </Link>
              ) : !isTokenGated ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ You need ≥50k $SRx402 tokens to make purchases
                  </p>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {purchasing ? 'Processing...' : 'Purchase Now'}
                </button>
              )}
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>ℹ️ How it works:</strong>
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Payment goes directly to the seller (P2P)</li>
                <li>Delivery URL shown immediately after payment</li>
                <li>No refunds or chargebacks (caveat emptor)</li>
                <li>Contact support only for delivery issues</li>
              </ul>
            </div>

            {/* Seller Info */}
            <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Seller</div>
              <div className="text-sm font-mono text-zinc-900 dark:text-zinc-50">
                {listing.wallet.slice(0, 8)}...{listing.wallet.slice(-6)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export wrapped in ProtectedContent
export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedContent>
      <ListingDetail params={params} />
    </ProtectedContent>
  );
}

