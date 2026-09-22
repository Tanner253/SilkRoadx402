/**
 * Platform Updates/Changelog Component
 *
 * Manually maintained list of platform updates
 */

export const UPDATES = [
    {
      date: 'September 2026',
      version: 'v2.2',
      title: 'Live gifts, gift cards and trending campaigns',
      items: [
        'A live tape of the latest gifts runs across the top of every page — every entry is a verified on-chain donation',
        'New Top donors leaderboard: the most generous wallets, ranked by verified ETH given. Give to climb',
        'Raising for a coin community? Paste its contract address and the campaign fills itself in from the chain — name, logo, story and socials',
        'Campaigns close to their goal now say exactly how little is left to go',
        'Share your gift: once your donation is verified, post it to X with a card showing what you gave and to whom',
        'Campaigns now sort by Trending — the ones people are giving to right now rise to the top',
      ],
    },
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

/** Newest release; the nav shows a "new" dot until the visitor has seen it. */
export const LATEST_UPDATE = UPDATES[0].version;

export function Updates() {
  return (
    <ol className="space-y-10">
      {UPDATES.map((update) => (
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
