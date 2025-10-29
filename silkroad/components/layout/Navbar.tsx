'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { useUSDCBalance } from '@/hooks/useUSDCBalance';
import { ProfileModal } from '@/components/modals/ProfileModal';

export function Navbar() {
  const { publicKey } = useWallet();
  const { balance, loading } = useUSDCBalance();
  const [mounted, setMounted] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            SilkRoad<span className="text-blue-600">x402</span>
          </div>
        </Link>

        {/* Navigation Links (show when wallet connected) */}
        {publicKey && (
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/browse" 
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
            >
              Browse
            </Link>
            <Link 
              href="/sell" 
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
            >
              Sell
            </Link>
            <Link 
              href="/my-listings" 
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
            >
              My Listings
            </Link>
          </div>
        )}

        {/* Right Side: USDC Balance + Profile + Wallet Button */}
        <div className="flex items-center gap-3">
          {/* USDC Balance */}
          {mounted && publicKey && (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
              <svg 
                className="h-5 w-5 text-blue-600" 
                viewBox="0 0 40 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="20" cy="20" r="20" fill="#2775CA"/>
                <path d="M24.5 17.5C24.5 15.567 22.933 14 21 14H16V21H21C22.933 21 24.5 19.433 24.5 17.5Z" fill="white"/>
                <path d="M21 23H16V26H21C22.933 26 24.5 24.433 24.5 22.5C24.5 21.567 22.933 23 21 23Z" fill="white"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">USDC</span>
                {loading ? (
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Loading...
                  </span>
                ) : balance !== null ? (
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    ${balance.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    --
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Profile Button */}
          {mounted && publicKey && (
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
              title="View Profile & Transaction History"
            >
              <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
        )}

        {/* Wallet Button */}
          {mounted && (
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg !h-10 !px-4 !text-sm !font-medium transition-colors" />
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </nav>
  );
}

