'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useActiveUsers } from '@/hooks/useActiveUsers';
import { usePathname } from 'next/navigation';

const X_COMMUNITY_URL = process.env.NEXT_PUBLIC_X_COMMUNITY_URL || null;

export function Navbar() {
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
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-background border-b border-border py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <span>💬</span>
          <span>Join the community on X</span>
          <span className="text-muted-foreground">→</span>
        </a>
      )}

      <nav className={`fixed ${X_COMMUNITY_URL ? 'top-8' : 'top-0'} app-navbar z-50 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-lg shadow-none`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Mobile menu button */}
          {mounted && (
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
            <Link href="/fundraisers" className={`text-sm font-medium transition-colors ${pathname === '/fundraisers' || pathname?.startsWith('/fundraisers/') ? 'text-primary' : 'text-foreground hover:text-foreground'}`}>
              Campaigns
            </Link>
            <Link href="/leaderboard" className={`text-sm font-medium transition-colors flex items-center gap-1 ${pathname === '/leaderboard' ? 'text-primary' : 'text-foreground hover:text-foreground'}`}>
              Top Fundraisers
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active users — pulsing dot style */}
            {mounted && (
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

      {/* Mobile overlay */}
      {mounted && mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className={`fixed ${X_COMMUNITY_URL ? 'top-[6.5rem]' : 'top-[4.5rem]'} left-0 right-0 bottom-0 z-40 bg-background md:hidden overflow-y-auto`}>
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
                  { href: '/fundraisers', label: 'Campaigns', icon: '💝' },
                  { href: '/leaderboard', label: 'Top Fundraisers', icon: '🏆' },
                  { href: '/fundraisers/new', label: 'Start a fundraiser', icon: '🌱' },
                ].map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      pathname === href || (href !== '/' && pathname?.startsWith(href))
                        ? 'bg-accent text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{icon}</span>{label}
                  </Link>
                ))}
              </nav>

              {/* Footer links */}
              <div className="pt-4 border-t border-border flex flex-col space-y-1">
                {[
                  { href: '/faq', label: 'FAQ', icon: '❓', external: false },
                  { href: '/updates', label: 'Updates', icon: '📋', external: false },
                  ...(X_COMMUNITY_URL ? [{ href: X_COMMUNITY_URL, label: 'Community (X)', icon: '💬', external: true }] : []),
                ].map(({ href, label, icon, external }) => (
                  external ? (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                      <span>{icon}</span>{label}
                    </a>
                  ) : (
                    <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
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
