'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-center space-x-6 py-3 px-4">
        {/* FAQ Button */}
        <Link
          href="/faq"
          className="flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          title="Frequently Asked Questions"
        >
          <span className="text-xl">❓</span>
          <span>FAQ</span>
        </Link>

        {/* Updates Button */}
        <Link
          href="/updates"
          className="flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          title="Platform Updates"
        >
          <span className="text-xl">📋</span>
          <span>Updates</span>
        </Link>

        {/* Whitepaper Link */}
        <a
          href="https://silk-roadx402.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          title="Read Whitepaper"
        >
          <span className="text-xl">📄</span>
          <span>Whitepaper</span>
        </a>

        {/* GitHub Link */}
        <a
          href="https://github.com/Tanner253?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          title="View on GitHub"
        >
          <span className="text-xl">💻</span>
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}

