'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

export default function Home() {
  const { 
    isConnected, 
    hasAcceptedTOS, 
    isTokenGated, 
    isLoading, 
    error,
    mounted,
  } = useAuth();

  const [betaPanelOpen, setBetaPanelOpen] = useState(false);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Homepage */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4">
        <div className="w-full max-w-4xl text-center">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="mb-4 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
              Anonymous Software Marketplace
          </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Peer-to-peer marketplace for private software using{' '}
              <span className="font-semibold text-blue-600">x402 micropayments</span> on Solana.
              No KYC. No middlemen. Just code.
            </p>
          </div>

          {/* BETA Information Panel */}
          <div className="mb-12 rounded-lg border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl dark:from-orange-950 dark:to-red-950 text-left overflow-hidden">
            {/* BETA Badge with Toggle */}
            <button
              onClick={() => setBetaPanelOpen(!betaPanelOpen)}
              className="w-full flex items-center justify-between p-6 hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors"
            >
              <div className="flex-1 flex items-center justify-center">
                <div className="inline-flex items-center space-x-3 rounded-full bg-orange-600 px-6 py-3 shadow-lg">
                  <span className="text-3xl">🚧</span>
                  <span className="text-xl font-bold text-white uppercase tracking-wide">BETA BUILD</span>
                  <span className="text-3xl">🚧</span>
                </div>
              </div>
              <div className="text-orange-600 dark:text-orange-400">
                <svg
                  className={`w-6 h-6 transition-transform ${betaPanelOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Collapsible Content */}
            {betaPanelOpen && (
              <div className="px-8 pb-8">
                {/* Critical Warning */}
                <div className="mb-6 rounded-lg border-2 border-red-600 bg-red-100 p-4 dark:bg-red-950">
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2 flex items-center">
                    <span className="text-2xl mr-2">⚠️</span>
                    CRITICAL: READ BEFORE USING
                  </h3>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200 leading-relaxed">
                    This platform is in <strong>BETA</strong>. While transactions are executed on Solana mainnet with real USDC, 
                    the platform may contain bugs. <strong>In rare edge cases, transaction failures may occur where the buyer loses 
                    money but the seller receives payment, or vice versa.</strong> By using this platform, you acknowledge and accept 
                    these risks. <strong>USE AT YOUR OWN RISK.</strong>
                  </p>
                </div>

                {/* Expected Functionality */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center">
                    <span className="text-xl mr-2">✅</span>
                    Expected Functionality
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1">•</span>
                      <span><strong>Browse & Purchase:</strong> Search listings, filter by category/vendor, purchase with x402 USDC payments</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1">•</span>
                      <span><strong>Sell & Monetize:</strong> Create listings with encrypted delivery URLs, manage listing states, track revenue</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1">•</span>
                      <span><strong>Token Gating:</strong> ≥50k $SRx402 tokens required for full platform access</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1">•</span>
                      <span><strong>Transaction History:</strong> View complete purchase/sales history with on-chain verification</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1">•</span>
                      <span><strong>Admin Review:</strong> All listings undergo admin approval before going live (24-48hr review time)</span>
                    </li>
                  </ul>
                </div>

                {/* Current Limitations */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center">
                    <span className="text-xl mr-2">🔧</span>
                    Current Limitations & Roadmap
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2 mt-1">•</span>
                      <span><strong>URL-Only Delivery:</strong> Currently, only URL-based delivery (GitHub, Dropbox, Google Drive) is supported. 
                      <strong className="text-blue-600 dark:text-blue-400"> Direct file-to-peer delivery coming soon.</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2 mt-1">•</span>
                      <span><strong>One-Time Delivery:</strong> Delivery URLs are shown once after purchase. No recovery mechanism exists yet.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2 mt-1">•</span>
                      <span><strong>No Refunds:</strong> All sales are final. No chargebacks or dispute resolution (caveat emptor).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2 mt-1">•</span>
                      <span><strong>Mainnet Only:</strong> x402 payments execute on Solana mainnet. Devnet testing available for developers.</span>
                    </li>
                  </ul>
                </div>

                {/* Please Report */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center">
                    <span className="text-xl mr-2">🐛</span>
                    Please Report Issues
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                    If you encounter any problems, please report them immediately:
                  </p>
                  <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1">•</span>
                      <span><strong>Transaction Failures:</strong> Payment succeeded but no delivery URL shown</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1">•</span>
                      <span><strong>Payment Issues:</strong> USDC deducted but purchase not recorded, or seller not credited</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1">•</span>
                      <span><strong>Navigation Errors:</strong> Pages not loading, broken links, routing issues</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1">•</span>
                      <span><strong>UI/UX Bugs:</strong> Display glitches, incorrect data shown, wallet connection problems</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1">•</span>
                      <span><strong>Security Concerns:</strong> Unauthorized access, data leaks, encryption failures</span>
                    </li>
                  </ul>
                </div>

                {/* Risk Disclosure */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center">
                    <span className="text-xl mr-2">⚖️</span>
                    Platform Risks & Disclaimers
                  </h3>
                  <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <p className="font-semibold">
                      <strong>By using SilkRoadx402, you acknowledge and accept the following risks:</strong>
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-orange-600 mr-2 mt-1">⚠️</span>
                        <span><strong>Transaction Risk:</strong> Blockchain transactions are irreversible. Failed transactions may result in loss of funds 
                        with no recovery mechanism.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 mr-2 mt-1">⚠️</span>
                        <span><strong>Vendor Trust:</strong> The platform does not verify vendor identity or product quality. Perform due diligence 
                        before purchasing. Search vendors by wallet address directly.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 mr-2 mt-1">⚠️</span>
                        <span><strong>Malicious Software:</strong> Vendors may list malware, backdoors, or non-functional code. Download and execute 
                        at your own risk. Use sandboxes and VM environments.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 mr-2 mt-1">⚠️</span>
                        <span><strong>No Support/Warranty:</strong> Products are sold "as-is" with no warranty, support, or guarantees. 
                        Sellers are not obligated to provide updates or assistance.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 mr-2 mt-1">⚠️</span>
                        <span><strong>Legal Compliance:</strong> You are responsible for ensuring your use of the platform complies with local laws. 
                        The platform does not endorse illegal activities.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Shareholder Info */}
                <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950">
                  <h3 className="text-base font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                    <span className="text-xl mr-2">💎</span>
                    For $SRx402 Token Holders
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    This BETA demonstrates the core x402 payment flow on Solana mainnet. Token holders gain exclusive early access 
                    to test the platform and provide feedback. Revenue from successful transactions flows directly to vendors P2P 
                    with no platform fees (BETA only). Platform development is ongoing with regular updates based on community feedback.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Cards */}
          {isConnected ? (
            <div className="mb-8 space-y-4">
              {/* Loading State */}
              {isLoading && (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Checking authentication...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900 dark:bg-red-950">
                  <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
                </div>
              )}

              {/* Success State */}
              {!isLoading && hasAcceptedTOS && (
                <div className="space-y-4">
                  {/* Token Gating Status */}
                  <div className={`rounded-lg border p-6 shadow-sm ${
                    isTokenGated
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                      : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950'
                  }`}>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">{isTokenGated ? '✅' : '⚠️'}</span>
                      <p className={`text-sm font-medium ${
                        isTokenGated 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {isTokenGated 
                          ? 'Token Gating Passed - Full Access Granted' 
                          : 'Insufficient $SRx402 Balance - Restricted Access'}
                      </p>
                    </div>
                    {!isTokenGated && (
                      <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        You need ≥50,000 $SRx402 tokens for full platform access
                      </p>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Link
                      href="/browse"
                      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500"
                    >
                      <div className="text-3xl mb-2">🔍</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Browse</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Explore software listings</p>
                    </Link>

                    <Link
                      href="/sell"
                      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500"
                    >
                      <div className="text-3xl mb-2">💼</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Sell</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">List your software</p>
                    </Link>

                    <Link
                      href="/my-listings"
                      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500"
                    >
                      <div className="text-3xl mb-2">📦</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">My Listings</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your products</p>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Disconnected State
            <div className="mb-8">
              <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    Connect Your Wallet
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Connect your Solana wallet to get started. You'll need Phantom installed.
                  </p>
                </div>
                <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg !h-12 !w-full !text-base !font-medium transition-colors" />
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-lg border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-2xl mb-3">🕵️</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Anonymous</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No KYC, no emails. Your wallet is your identity.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">x402 Payments</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Direct P2P micropayments using HTTP 402 protocol.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-2xl mb-3">🪙</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Token Gated</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Hold ≥50k $SRx402 tokens for full access.
          </p>
        </div>
          </div>
        </div>
    </div>
    </>
  );
}
