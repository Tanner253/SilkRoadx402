/**
 * Learn More: Pump.fun Tokenized Agents
 *
 * Dedicated explainer section for the Agent Token integration,
 * rendered below the FAQ on the /faq page.
 */

export function AgentLearnMore() {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 backdrop-blur-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-primary text-lg font-bold">
          A
        </span>
        <h2 className="text-2xl font-bold text-foreground">
          Powered by Pump.fun Tokenized Agents
        </h2>
      </div>

      <p className="text-muted-foreground leading-relaxed mb-6">
        OpenFund is one of the first platforms to integrate{' '}
        <strong className="text-foreground">Pump.fun&apos;s Tokenized Agents</strong> — a
        new on-chain primitive that lets applications collect revenue and automatically
        reinvest a portion into token buybacks. This creates a sustainable flywheel
        where platform usage directly benefits the community.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {[
          {
            title: 'How It Works',
            desc: 'A smart contract sits on top of the Pump bonding curve. When donations flow through the agent, a configured percentage is automatically used for buybacks — no manual intervention, no trust assumptions.',
          },
          {
            title: 'Why It Matters',
            desc: 'Traditional platforms pocket their fees. With Tokenized Agents, revenue is recycled back into the token, creating organic demand that grows with platform adoption.',
          },
          {
            title: 'Dual Payment Paths',
            desc: 'OpenFund supports both x402 direct USDC payments and the new Agent Token path. Users choose which method they prefer — nothing is forced.',
          },
          {
            title: 'Fully On-Chain',
            desc: 'Buyback logic is enforced by Solana smart contracts, not off-chain promises. Every transaction is verifiable on-chain via invoice validation.',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-border bg-muted p-4"
          >
            <h3 className="text-sm font-bold text-primary mb-2">
              {card.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-muted border border-border p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Technical Details</h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">&#x2713;</span>
            <span>
              Built with{' '}
              <code className="text-primary bg-accent px-1.5 py-0.5 rounded">
                @pump-fun/agent-payments-sdk
              </code>{' '}
              — the official Pump.fun npm package
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">&#x2713;</span>
            <span>
              Uses <code className="text-primary bg-accent px-1.5 py-0.5 rounded">PumpAgent.buildAcceptPaymentInstructions()</code> for
              server-side transaction construction
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">&#x2713;</span>
            <span>
              On-chain verification via <code className="text-primary bg-accent px-1.5 py-0.5 rounded">PumpAgent.validateInvoicePayment()</code> with
              retry logic (up to 10 attempts, 2s intervals)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">&#x2713;</span>
            <span>
              Minimum donation: $0.10 USDC — invoice window of 24 hours per transaction
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">&#x2713;</span>
            <span>
              Buyback BPS (basis points) configured at agent creation time on Pump.fun
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href="https://github.com/pump-fun/pump-fun-skills/blob/main/tokenized-agents/SKILL.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-accent border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-accent transition-colors"
        >
          Read the Pump.fun Docs
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <a
          href="https://www.npmjs.com/package/@pump-fun/agent-payments-sdk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          View on npm
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
