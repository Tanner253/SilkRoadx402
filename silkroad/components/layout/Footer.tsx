'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-orange-900/30 bg-[#0f0d0a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center space-x-1 sm:space-x-4 py-2 sm:py-3 px-2 sm:px-4">
        <Link
          href="/faq"
          className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
          title="FAQ"
        >
          <span className="hidden sm:inline">FAQ</span>
        </Link>

        <Link
          href="/updates"
          className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
          title="Updates"
        >
          <span className="hidden sm:inline">Updates</span>
        </Link>

        <span className="text-white/20 hidden sm:inline">·</span>

        <span className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-yellow-400">
          <span>paying dex at bond</span>
        </span>

        <span className="text-white/20 hidden sm:inline">·</span>

        <span className="hidden sm:inline text-xs text-white/25">
          OpenFund — No KYC Crowdfunding on Solana
        </span>
      </div>
    </footer>
  );
}
