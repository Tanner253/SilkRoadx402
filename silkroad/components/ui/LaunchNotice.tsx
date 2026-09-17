/**
 * Stand-in for anything that used to need a connected Solana wallet.
 *
 * OpenFund is going wallet-connectionless: donors will send ETH on Robinhood
 * Chain straight from their own wallet, and the site will pick the payment up
 * on-chain. Until that flow ships, these spots say so plainly instead of
 * asking visitors to connect a wallet we no longer support.
 */

import { PiggyBank } from '@/components/mascot/PiggyBank';

interface LaunchNoticeProps {
  /** What's waiting on the launch, e.g. "Donations". */
  subject: string;
  /** Show the sleeping pig — for full-page placements. */
  withMascot?: boolean;
}

export function LaunchNotice({ subject, withMascot = false }: LaunchNoticeProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-6 text-center">
      {withMascot ? (
        <div className="mx-auto mb-3 w-40">
          <PiggyBank pose="sleep" size={160} still />
        </div>
      ) : null}
      <p className="text-sm font-medium text-foreground">{subject} open with our Robinhood Chain launch.</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        You won&rsquo;t need to connect a wallet — just send from the one you already use.
      </p>
    </div>
  );
}
