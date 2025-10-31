/**
 * Platform Updates/Changelog Component
 * 
 * Manually maintained list of platform updates
 */

export function Updates() {
  const updates = [
    {
      date: 'October 31, 2025',
      version: 'v0.5.0',
      title: 'UI Refresh & Featured Listings',
      items: [
        '🎨 Complete color refresh - pump.fun green theme across the app',
        '📋 Grid and list view toggle for all listings pages',
        'Compact list view for efficient browsing (more listings visible)',
        '📌 Admin pin feature - promote up to 3 featured listings',
        'Pinned listings always appear first with "Featured" badge',
        '🔗 External links kept blue for standard web UX',
        'Chat message reactions (❤️, 👍, 👎, 👀)',
        '📱 Improved mobile navigation with hamburger menu',
      ],
    },
    {
      date: 'October 31, 2025',
      version: 'v0.4.0',
      title: 'Public Chat & Community Features',
      items: [
        '💬 RuneScape-style public chat for marketplace trading',
        'Optional listing attachments - shill your products in chat',
        'Advanced content filtering (URLs blocked, profanity filtered)',
        'Color-coded messages (🟢 selling, 🔵 buying, 🟡 general)',
        '60-second rate limiting with cooldown timer',
      ],
    },
    {
      date: 'October 31, 2025',
      version: 'v0.3.0',
      title: 'Reviews, Reports & Activity Logging',
      items: [
        'Verified buyer reviews system on all listings',
        'User reporting with greyed-out flag icon',
        'Comprehensive admin activity logging (all actions tracked)',
        'Auto-refresh admin dashboard with isolated components',
        'FAQ & Updates pages with footer navigation',
      ],
    },
    {
      date: 'October 30, 2025',
      version: 'v0.2.0',
      title: 'Anti-Spam & Enhanced Security',
      items: [
        'Maximum 3 active listings per wallet',
        'Rate limiting on all API endpoints',
        'Auto-pull listings after 3 failed purchases',
        'Enhanced seller USDC account validation',
        'Solflare wallet support added',
      ],
    },
    {
      date: 'October 29, 2025',
      version: 'v0.1.0',
      title: 'Initial Beta Launch',
      items: [
        'x402 micropayment protocol integration',
        'Anonymous P2P software marketplace',
        'Token gating (50k $SRx402 required)',
        'Solana USDC payments',
        'Admin approval system',
      ],
    },
  ];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        📋 Platform Updates
      </h2>
      <div className="space-y-6">
        {updates.map((update, index) => (
          <div
            key={index}
            className="border-l-4 border-green-600 pl-6 pb-6 last:pb-0"
          >
            <div className="mb-2 flex items-center space-x-3">
              <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                {update.version}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {update.date}
              </span>
            </div>
            <h3 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {update.title}
            </h3>
            <ul className="space-y-2">
              {update.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="flex items-start space-x-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <span className="mt-1 text-green-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

