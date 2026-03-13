'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { useUSDCBalance } from '@/hooks/useUSDCBalance';
import { useActiveUsers } from '@/hooks/useActiveUsers';
import { usePathname } from 'next/navigation';

const X_COMMUNITY_URL = process.env.NEXT_PUBLIC_X_COMMUNITY_URL || null;

export function Navbar() {
  const { publicKey } = useWallet();
  const { balance, loading } = useUSDCBalance();
  const activeUsers = useActiveUsers();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Top banner — only renders if X community URL is configured */}
      {X_COMMUNITY_URL && (
        <a
          href={X_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-[#0f0d0a] border-b border-orange-900/20 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-orange-950/30 transition-colors"
        >
          <span>💬</span>
          <span>Join the community on X</span>
          <span className="text-white/50">→</span>
        </a>
      )}

      <nav className={`fixed ${X_COMMUNITY_URL ? 'top-8' : 'top-0'} z-50 w-full border-b border-orange-900/30 bg-[#0f0d0a]/95 backdrop-blur-md shadow-lg shadow-orange-900/10`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Mobile menu button */}
          {mounted && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-white hover:bg-orange-900/30 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              <span className="gradient-text">Open</span><span className="text-white">Funx402</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/fundraisers" className={`text-sm font-medium transition-colors ${pathname === '/fundraisers' || pathname?.startsWith('/fundraisers/') ? 'text-[#F97316]' : 'text-white/80 hover:text-white'}`}>
              Campaigns
            </Link>
            <Link href="/leaderboard" className={`text-sm font-medium transition-colors flex items-center gap-1 ${pathname === '/leaderboard' ? 'text-[#F97316]' : 'text-white/80 hover:text-white'}`}>
              <span>🏆</span> Top Fundraisers
            </Link>
            {publicKey && (
              <>
                <Link href="/fundraisers/new" className={`text-sm font-medium transition-colors ${pathname === '/fundraisers/new' ? 'text-[#F97316]' : 'text-white/80 hover:text-white'}`}>
                  Start a Fund
                </Link>
                <Link href="/fundraisers/my" className={`text-sm font-medium transition-colors ${pathname === '/fundraisers/my' ? 'text-[#F97316]' : 'text-white/80 hover:text-white'}`}>
                  My Funds
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active users — pulsing dot style */}
            {mounted && (
              <div className="hidden md:flex items-center gap-1.5 text-sm text-white/60">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="font-medium text-white/80">{activeUsers}</span>
                <span className="text-xs">online</span>
              </div>
            )}

            {/* USDC balance */}
            {mounted && publicKey && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <span className="text-white/50 text-xs">USDC</span>
                {loading ? (
                  <span className="text-white/60 text-sm">...</span>
                ) : balance !== null ? (
                  <span className="font-semibold text-white">${balance.toFixed(2)}</span>
                ) : (
                  <span className="text-white/40">--</span>
                )}
              </div>
            )}

            {/* Profile */}
            {mounted && publicKey && (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-orange-900/50 bg-orange-950/30 px-2 sm:px-3 py-2 hover:bg-orange-900/40 transition-colors"
                title="Profile"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Wallet */}
            {mounted && (
              <WalletMultiButton className="!bg-[#F97316] hover:!bg-[#ea6c0e] !rounded-lg !h-9 !px-3 sm:!px-4 !text-xs sm:!text-sm !font-semibold !transition-colors !text-black" />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mounted && mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className={`fixed ${X_COMMUNITY_URL ? 'top-[5.5rem]' : 'top-[3.5rem]'} left-0 right-0 bottom-0 z-40 bg-[#0f0d0a] md:hidden overflow-y-auto`}>
            <div className="flex flex-col p-6 space-y-6">

              {/* Active users + balance */}
              <div className="flex items-center justify-between rounded-lg border border-orange-900/30 bg-orange-950/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-sm text-white/70">{activeUsers} online</span>
                </div>
                {publicKey && balance !== null && (
                  <span className="text-sm font-semibold text-white">${balance.toFixed(2)} USDC</span>
                )}
              </div>

              {/* Nav links */}
              <nav className="flex flex-col space-y-1">
                {[
                  { href: '/fundraisers', label: 'Campaigns', icon: '💝' },
                  { href: '/leaderboard', label: 'Top Fundraisers', icon: '🏆' },
                  ...(publicKey ? [
                    { href: '/fundraisers/new', label: 'Start a Fund', icon: '🚀' },
                    { href: '/fundraisers/my', label: 'My Funds', icon: '📊' },
                    { href: '/profile', label: 'Profile', icon: '👤' },
                  ] : []),
                ].map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      pathname === href || (href !== '/' && pathname?.startsWith(href))
                        ? 'bg-orange-900/30 text-[#F97316]'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <span>{icon}</span>{label}
                  </Link>
                ))}
              </nav>

              {/* Footer links */}
              <div className="pt-4 border-t border-orange-900/30 flex flex-col space-y-1">
                {[
                  { href: '/faq', label: 'FAQ', icon: '❓', external: false },
                  { href: '/updates', label: 'Updates', icon: '📋', external: false },
                  ...(X_COMMUNITY_URL ? [{ href: X_COMMUNITY_URL, label: 'Community (X)', icon: '💬', external: true }] : []),
                ].map(({ href, label, icon, external }) => (
                  external ? (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors">
                      <span>{icon}</span>{label}
                    </a>
                  ) : (
                    <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors">
                      <span>{icon}</span>{label}
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
