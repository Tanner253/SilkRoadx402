/**
 * Platform Updates/Changelog Component
 *
 * Manually maintained list of platform updates
 */

export function Updates() {
  const updates = [
    {
      date: 'September 2026',
      version: 'v2.1',
      title: '$OPENFUND is live',
      items: [
        '$OPENFUND launched on pons, on Robinhood Chain',
        'Official contract address: 0xFB4eD31b0c895eee1C4778680d972c5695056902 — treat any other address claiming to be $OPENFUND as fake',
      ],
    },
    {
      date: 'September 2026',
      version: 'v2.0.0',
      title: 'Wallet-less giving on Robinhood Chain',
      items: [
        'OpenFund now runs on Robinhood Chain (chain ID 4663); donations are in ETH',
        'No wallet connection, ever: tell us which wallet you’re giving from and send from it — we spot the transfer on-chain and count it',
        'A reminder follows you around the site until your donation is confirmed',
        'Every donation is verified on-chain — right network, right address, confirmed — and counted exactly once',
        'Campaigns go live the moment they’re published; no approval queue',
        'Add as many links as you like to a campaign: YouTube videos play right on the page',
        'Creators manage their campaign with a private manage link instead of an account',
        'Only verified donors can leave words of support',
        'A new home page, and Penny, the OpenFund piggy bank',
      ],
    },
    {
      date: 'February – March 2026',
      version: 'v1',
      title: 'OpenFund on Solana',
      items: [
        'OpenFund launched as no-KYC crowdfunding with USDC donations on Solana',
        'Campaigns from this era have been retired',
      ],
    },
  ];

  return (
    <ol className="space-y-10">
      {updates.map((update) => (
        <li key={update.version} className="grid gap-3 border-t border-border pt-8 md:grid-cols-[160px_minmax(0,1fr)] md:gap-10">
          <div>
            <p className="text-sm font-medium text-foreground">{update.version}</p>
            <p className="text-xs text-muted-foreground">{update.date}</p>
          </div>
          <div>
            <h2 className="mb-4 text-xl font-medium tracking-[-0.01em] text-foreground">{update.title}</h2>
            <ul className="space-y-2">
              {update.items.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#62754d]" aria-hidden="true" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
