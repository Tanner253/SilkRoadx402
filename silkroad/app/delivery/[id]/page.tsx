'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

function ThankYouContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/api/delivery/${id}`);
        setTransaction(res.data.transaction);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Could not load donation details');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0d0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0d0a] flex items-center justify-center px-4 py-12">
      <div className="mx-auto max-w-lg w-full">
        {/* Card */}
        <div className="rounded-2xl border border-orange-900/30 bg-white/3 backdrop-blur-sm p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-black text-white mb-2">
            Thank you!
          </h1>
          <p className="text-white/50 mb-8">
            Your donation was sent successfully.
          </p>

          {error ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400 mb-6">
              {error}
            </div>
          ) : transaction ? (
            <div className="space-y-3 mb-8 text-left">
              {transaction.itemDetails?.title && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Campaign</span>
                  <span className="text-white font-medium">{transaction.itemDetails.title}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Amount</span>
                <span className="text-[#FBBF24] font-bold text-lg">
                  ${transaction.amount?.toFixed(2)} USDC
                </span>
              </div>
              {transaction.txnHash && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-white/40">Transaction</span>
                  <a
                    href={`https://solscan.io/tx/${transaction.txnHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#F97316] hover:text-[#FBBF24] transition-colors"
                  >
                    {transaction.txnHash.slice(0, 8)}...{transaction.txnHash.slice(-6)} ↗
                  </a>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3">
            {transaction?.listingId && (
              <Link
                href={`/fundraisers/${transaction.listingId}`}
                className="flex-1 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-bold text-black hover:bg-[#ea6c0e] transition-colors text-center"
              >
                Back to Campaign
              </Link>
            )}
            <Link
              href="/fundraisers"
              className="flex-1 rounded-xl border border-orange-900/50 bg-orange-950/20 px-6 py-3 text-sm font-semibold text-orange-300 hover:bg-orange-900/30 transition-colors text-center"
            >
              Browse Campaigns
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  return <ThankYouContent params={params} />;
}
