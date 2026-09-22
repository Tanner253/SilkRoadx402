'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useActiveUsers } from '@/hooks/useActiveUsers';
import { usePathname } from 'next/navigation';
import { DonationTicker } from '@/components/donations/DonationTicker';

const X_COMMUNITY_URL = process.env.NEXT_PUBLIC_X_COMMUNITY_URL || 'https://x.com/OpenFundPons';

export function Navbar() {
  const activeUsers = useActiveUsers();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on navigation (adjusting state during render, per
  // React's guidance, instead of a setState-in-effect).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileMenuOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* One fixed header stack: community bar, live donation tape, then the
          nav. Its total height is --app-header (globals.css), which the page
          and the mobile menu offset from. */}
      <header className="fixed inset-x-0 top-0 z-50">
        <a
          href={X_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 items-center justify-center gap-2 border-b border-border bg-background text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span>💬</span>
          <span>Join the community on X</span>
          <span className="text-muted-foreground">→</span>
        </a>
        <DonationTicker />

      <nav className="app-navbar w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Mobile menu button */}
          {(
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
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
              <span className="gradient-text">Open</span><span className="text-foreground">Fund</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/fundraisers" className={`text-sm font-medium transition-colors ${pathname === '/fundraisers' || (pathname?.startsWith('/fundraisers/') && !['/fundraisers/my', '/fundraisers/new'].includes(pathname)) ? 'text-primary' : 'text-foreground hover:text-foreground'}`}>
              Campaigns
            </Link>
            <Link href="/leaderboard" className={`text-sm font-medium transition-colors flex items-center gap-1 ${pathname === '/leaderboard' ? 'text-primary' : 'text-foreground hover:text-foreground'}`}>
              Leaderboard
            </Link>
            <Link href="/fundraisers/my" className={`text-sm font-medium transition-colors ${pathname === '/fundraisers/my' ? 'text-primary' : 'text-foreground hover:text-foreground'}`}>
              My fundraisers
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active users — pulsing dot style */}
            {activeUsers > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="font-medium text-foreground">{activeUsers}</span>
                <span className="text-xs">online</span>
              </div>
            )}

            <Link
              href="/fundraisers/new"
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-[#293d23] sm:px-4 sm:text-sm"
            >
              Start a fundraiser
            </Link>
          </div>
        </div>
      </nav>
      </header>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 top-[var(--app-header)] z-40 overflow-y-auto bg-background md:hidden">
            <div className="flex flex-col p-6 space-y-6">

              {/* Active users */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-accent px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-sm text-muted-foreground">{activeUsers} online</span>
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col space-y-1">
                {[
                  { href: '/fundraisers', label: 'Campaigns' },
                  { href: '/leaderboard', label: 'Leaderboard' },
                  { href: '/fundraisers/new', label: 'Start a fundraiser' },
                  { href: '/fundraisers/my', label: 'My fundraisers' },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      pathname === href || (href === '/fundraisers' && !!pathname?.startsWith('/fundraisers/') && !['/fundraisers/my', '/fundraisers/new'].includes(pathname))
                        ? 'bg-accent text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Footer links */}
              <div className="pt-4 border-t border-border flex flex-col space-y-1">
                {[
                  { href: '/faq', label: 'FAQ', external: false },
                  { href: '/updates', label: 'Updates', external: false },
                  ...(X_COMMUNITY_URL ? [{ href: X_COMMUNITY_URL, label: 'Community (X)', external: true }] : []),
                ].map(({ href, label, external }) => (
                  external ? (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                      {label}
                    </a>
                  ) : (
                    <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                      {label}
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
