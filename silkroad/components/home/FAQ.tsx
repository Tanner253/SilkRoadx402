'use client';

import { useState } from 'react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is OpenFund?',
      answer: (
        <p>
          OpenFund is no-KYC crowdfunding. Anyone can start a fundraiser for what matters to them,
          and anyone can chip in — no identity checks, no bank account, no gatekeepers.
          Contributions go straight to the fundraiser&apos;s own wallet. OpenFund is moving to
          Robinhood Chain, where donations are made in ETH.
        </p>
      ),
    },
    {
      question: 'Do I need to sign up, connect a wallet or verify my identity?',
      answer: (
        <>
          <p className="mb-3"><strong>No.</strong> There is nothing to sign up for.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>No email</li>
            <li>No ID or KYC verification</li>
            <li>No connecting your wallet to this site</li>
          </ul>
          <p className="mt-3">To give, you send from the wallet you already use, the same way you&apos;d pay a friend.</p>
        </>
      ),
    },
    {
      question: 'Which network and currency do donations use?',
      answer: (
        <>
          <p className="mb-3">
            <strong>ETH on Robinhood Chain</strong> (chain ID 4663) — the network pons runs on.
          </p>
          <p className="text-sm text-primary bg-accent border border-border p-3 rounded">
            Robinhood Chain is not Ethereum mainnet. ETH sent on any other network won&apos;t be counted
            toward the campaign and may be difficult or impossible to recover. Check that your wallet
            is on Robinhood Chain before you send.
          </p>
        </>
      ),
    },
    {
      question: 'How will donating work?',
      answer: (
        <ol className="list-decimal list-inside space-y-2">
          <li>Open a campaign and choose how much to give</li>
          <li>Send that amount of ETH from your own wallet to the address the campaign shows</li>
          <li>OpenFund picks the payment up on-chain and adds it to the campaign&apos;s total and donation log</li>
        </ol>
      ),
    },
    {
      question: 'How do I start a fundraiser?',
      answer: (
        <p>
          Fundraisers open with our Robinhood Chain launch. You&apos;ll give your campaign a title,
          tell people why it matters, set a goal, and enter the wallet address donations should go
          to. Campaigns are reviewed before they appear publicly.
        </p>
      ),
    },
    {
      question: 'Is this safe? How do I protect myself?',
      answer: (
        <>
          <p className="mb-3"><strong>Tips for donors:</strong></p>
          <ul className="list-disc list-inside space-y-2 mb-3">
            <li>Read the campaign and look up the creator&apos;s address on a block explorer</li>
            <li>Start with a small amount</li>
            <li>Double-check you&apos;re sending on Robinhood Chain</li>
            <li>Report anything that looks wrong</li>
            <li>Never share your seed phrase with anyone — OpenFund will never ask for it</li>
          </ul>
          <p className="text-sm text-primary bg-accent border border-border p-3 rounded">
            OpenFund is permissionless. We review campaigns but can&apos;t guarantee outcomes.
            Only give what you can afford to lose.
          </p>
        </>
      ),
    },
    {
      question: 'How do I report a suspicious campaign?',
      answer: (
        <ol className="list-decimal list-inside space-y-2">
          <li>Open the campaign page</li>
          <li>Use the report option at the top right</li>
          <li>Tell us what&apos;s wrong — our admins review every report</li>
        </ol>
      ),
    },
    {
      question: "What happens if a campaign doesn't reach its goal?",
      answer: (
        <p>
          The fundraiser keeps everything that was given. Contributions go straight to their
          wallet as they&apos;re made, so there&apos;s nothing held back or returned — the goal is a
          target, not a threshold.
        </p>
      ),
    },
    {
      question: 'What is $OPEN?',
      answer: (
        <p>
          $OPEN is the OpenFund community token, launching on pons on Robinhood Chain. The contract
          address will be posted here at launch — until then, treat any address claiming to be
          $OPEN as fake.
        </p>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-muted backdrop-blur-sm p-8">
      <h2 className="mb-8 text-3xl font-bold text-foreground">
        Frequently asked questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="rounded-lg border border-border overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted transition-colors"
            >
              <span className="font-semibold text-foreground pr-4">{faq.question}</span>
              <span className="text-2xl text-muted-foreground flex-shrink-0">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
