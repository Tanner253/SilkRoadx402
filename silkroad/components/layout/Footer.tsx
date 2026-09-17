'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="app-footer border-t border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center space-x-1 sm:space-x-4 py-2 sm:py-3 px-2 sm:px-4">
        <Link
          href="/faq"
          className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="FAQ"
        >
          <span className="hidden sm:inline">FAQ</span>
        </Link>

        <Link
          href="/updates"
          className="flex items-center space-x-1 sm:space-x-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Updates"
        >
          <span className="hidden sm:inline">Updates</span>
        </Link>

        <span className="text-muted-foreground hidden sm:inline">·</span>

        <span className="hidden sm:inline text-xs text-muted-foreground">
          OpenFund — Open fundraising
        </span>
      </div>
    </footer>
  );
}
