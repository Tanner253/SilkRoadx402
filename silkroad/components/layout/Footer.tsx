import Link from 'next/link';

const links = [
  { href: '/fundraisers', label: 'Campaigns' },
  { href: '/fundraisers/new', label: 'Start a fundraiser' },
  { href: '/faq', label: 'FAQ' },
  { href: '/updates', label: 'Updates' },
];

export function Footer() {
  return (
    <footer className="app-footer border-t border-border">
      <div className="mx-auto flex max-w-[1456px] flex-col gap-4 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">OpenFund</span> — open fundraising on Robinhood Chain
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="text-muted-foreground transition-colors hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
