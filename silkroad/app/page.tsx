'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { ChristmasParticles } from '@/components/effects/ChristmasParticles';

const CONTRACT_ADDRESS = '49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump';

export default function Home() {
  const { 
    isConnected, 
    hasAcceptedTOS, 
    isTokenGated, 
    isLoading, 
    error,
    mounted,
  } = useAuth();
  
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      <ChristmasParticles />
      {/* Homepage */}
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center bg-gradient-to-b from-red-50 via-green-50 to-white dark:from-red-950 dark:via-green-950 dark:to-black px-4 py-12 relative z-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(21, 128, 61, 0.1) 0%, transparent 50%)'
        }}
      >
        <div className="w-full max-w-4xl text-center">
          {/* Christmas Hero Section */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="text-5xl animate-bounce">🎄</span>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent sm:text-6xl">
                Happy Holidays!
              </h1>
              <span className="text-5xl animate-bounce" style={{animationDelay: '0.2s'}}>🎄</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Anonymous Digital Marketplace
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-700 dark:text-zinc-300">
              🎁 The perfect place for <span className="font-bold text-red-600 dark:text-red-400">holiday shopping</span>!{' '}
              Peer-to-peer marketplace using{' '}
              <span className="font-semibold text-green-600 dark:text-green-400">x402 micropayments</span> on Solana.
              <br />
              <span className="text-base">No KYC. No middlemen. Just freedom. 🎅</span>
            </p>
          </div>

          {/* Contract Address */}
          <div className="mb-6 rounded-xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/50 dark:via-pink-950/50 dark:to-purple-950/50 p-4 shadow-md backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                💎 $SRx402 Token Contract Address
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <div className="flex-1 rounded-lg bg-white/80 dark:bg-zinc-900/80 p-3 border border-purple-200 dark:border-purple-800 overflow-hidden">
                  <p className="font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 break-all text-center sm:text-left">
                    {CONTRACT_ADDRESS}
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-md whitespace-nowrap min-w-[100px]"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Christmas 0% Fees Banner */}
          <div className="mb-8 rounded-2xl border-2 border-red-500 bg-gradient-to-r from-red-50 via-green-50 to-red-50 dark:from-red-950/50 dark:via-green-950/50 dark:to-red-950/50 p-6 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-4xl">🎁</span>
                <div className="text-left">
                  <h3 className="text-3xl font-black bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent">
                    0% FEES
                  </h3>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    🎄 100% Direct P2P 🎄
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-zinc-400">|</div>
              <p className="text-center sm:text-left text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
                <span className="font-bold text-zinc-900 dark:text-zinc-50">🎅 Our gift to you!</span> Sellers keep <span className="text-red-600 dark:text-red-400 font-bold">100%</span> of every sale. Direct payments via Solana USDC. The best present for sellers! 🎁
              </p>
            </div>
          </div>

          {/* Status Cards */}
          {isConnected ? (
            <div className="mb-8 space-y-4">
              {/* Loading State */}
              {isLoading && (
                <div className="rounded-lg border border-red-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-red-800 dark:bg-zinc-900/90">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">🎄 Checking authentication...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50/90 p-6 shadow-sm backdrop-blur-sm dark:border-red-900 dark:bg-red-950/90">
                  <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
                </div>
              )}

              {/* Success State */}
              {!isLoading && hasAcceptedTOS && (
                <div className="space-y-4">
                  {/* Token Gating Status */}
                  <div className={`rounded-lg border p-6 shadow-sm backdrop-blur-sm ${
                    isTokenGated
                      ? 'border-green-300 bg-green-50/90 dark:border-green-800 dark:bg-green-950/90'
                      : 'border-yellow-300 bg-yellow-50/90 dark:border-yellow-800 dark:bg-yellow-950/90'
                  }`}>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">{isTokenGated ? '🎁' : '⚠️'}</span>
                      <p className={`text-sm font-medium ${
                        isTokenGated 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {isTokenGated 
                          ? '🎄 Full Access Granted - Happy Holidays!' 
                          : 'Insufficient $SRx402 Balance - Restricted Access'}
                      </p>
                    </div>
                    {!isTokenGated && (
                      <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        🎅 You need ≥50,000 $SRx402 tokens for full platform access
                      </p>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Link
                      href="/browse"
                      className="rounded-lg border-2 border-red-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-red-500 hover:shadow-md hover:scale-105 dark:border-red-800 dark:bg-zinc-900/90 dark:hover:border-red-500"
                    >
                      <div className="text-3xl mb-2">🎁</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Browse Gifts</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Find perfect presents</p>
                    </Link>

                    <Link
                      href="/sell"
                      className="rounded-lg border-2 border-green-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-green-500 hover:shadow-md hover:scale-105 dark:border-green-800 dark:bg-zinc-900/90 dark:hover:border-green-500"
                    >
                      <div className="text-3xl mb-2">🎄</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Sell</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">List holiday items</p>
                    </Link>

                    <Link
                      href="/my-listings"
                      className="rounded-lg border-2 border-red-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-red-500 hover:shadow-md hover:scale-105 dark:border-red-800 dark:bg-zinc-900/90 dark:hover:border-red-500"
                    >
                      <div className="text-3xl mb-2">🎅</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">My Listings</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your shop</p>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Disconnected State
            <div className="mb-8">
              <div className="rounded-lg border-2 border-red-300 bg-white/90 p-8 shadow-lg backdrop-blur-sm dark:border-red-800 dark:bg-zinc-900/90">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-green-100 dark:from-red-900 dark:to-green-900">
                    <span className="text-3xl">🎅</span>
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    🎄 Connect Your Wallet 🎄
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Connect your Solana wallet to start your holiday shopping! 🎁
                  </p>
                </div>
                <WalletMultiButton className="!bg-gradient-to-r !from-red-600 !to-green-600 hover:!from-red-700 hover:!to-green-700 !rounded-lg !h-12 !w-full !text-base !font-medium transition-colors" />
              </div>
            </div>
          )}

          {/* Christmas Features */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-lg border-2 border-red-200 bg-white/80 p-6 backdrop-blur-sm dark:border-red-800 dark:bg-zinc-900/80 hover:scale-105 transition-transform">
              <div className="text-2xl mb-3">🎅</div>
              <h3 className="mb-2 font-semibold text-red-700 dark:text-red-300">Anonymous</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No KYC, no emails. Shop privately this holiday season. Your wallet is your identity.
              </p>
            </div>

            <div className="rounded-lg border-2 border-green-200 bg-white/80 p-6 backdrop-blur-sm dark:border-green-800 dark:bg-zinc-900/80 hover:scale-105 transition-transform">
              <div className="text-2xl mb-3">🎁</div>
              <h3 className="mb-2 font-semibold text-green-700 dark:text-green-300">0% Platform Fees</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Our Christmas gift! Sellers keep 100% of every sale. Direct P2P payments via USDC.
              </p>
            </div>

            <div className="rounded-lg border-2 border-red-200 bg-white/80 p-6 backdrop-blur-sm dark:border-red-800 dark:bg-zinc-900/80 hover:scale-105 transition-transform">
              <div className="text-2xl mb-3">🎄</div>
              <h3 className="mb-2 font-semibold text-red-700 dark:text-red-300">Token Gated</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Hold ≥50k $SRx402 tokens for full access to the marketplace.
              </p>
            </div>
          </div>
        </div>
    </div>
    </>
  );
}
