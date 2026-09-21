'use client';

import { useState } from 'react';
import { ContractAddress } from '@/components/ContractAddress';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is OpenFund?',
      answer: (
        <p>
          OpenFund is no-KYC crowdfunding. Anyone can start a fundraiser for what matters to them,
          and anyone can chip in — no identity checks, no bank account, no gatekeepers.
          Contributions go straight to the fundraiser&apos;s own wallet. OpenFund runs on
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
      question: 'How does donating work?',
      answer: (
        <>
        <ol className="list-decimal list-inside space-y-2">
          <li>Open a campaign and enter the wallet address you&apos;ll give from</li>
          <li>We show you the campaign&apos;s address — send ETH to it from that wallet, on Robinhood Chain</li>
          <li>We spot the transfer on-chain and add it to the campaign&apos;s total and donation log, usually within seconds</li>
        </ol>
        <p className="mt-3 text-sm text-primary bg-accent border border-border p-3 rounded">
          A donation is only counted if it comes from the wallet you told us about. Send directly from that wallet —
          transfers from an exchange or through a smart-contract wallet come from a different address and can&apos;t be matched.
        </p>
        </>
      ),
    },
    {
      question: 'How do I start a fundraiser?',
      answer: (
        <p>
          Click &ldquo;Start a fundraiser&rdquo;, give your campaign a title, tell people why it
          matters, set a goal in ETH, and enter the Robinhood Chain wallet address donations should
          go to. It goes live as soon as you publish — there&apos;s no review queue.
        </p>
      ),
    },
    {
      question: 'What is a manage link?',
      answer: (
        <p>
          There are no accounts, so when you publish a campaign you get a private manage link instead.
          Anyone with it can edit or pause the campaign — so keep it safe and don&apos;t share it. It
          can&apos;t change where donations go, and once a campaign has received donations it can&apos;t
          be deleted, so donors always have a public record of where their money went. If you lose it, the campaign keeps running and
          receiving donations, but you won&apos;t be able to edit it.
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
            OpenFund is permissionless: campaigns go live without pre-screening, and our admins
            review reports after the fact. We can&apos;t guarantee outcomes — only give what you
            can afford to lose.
          </p>
        </>
      ),
    },
    {
      question: 'How do I report a suspicious campaign?',
      answer: (
        <ol className="list-decimal list-inside space-y-2">
          <li>Open the campaign page</li>
          <li>Click &ldquo;Report this campaign&rdquo; under the donation box</li>
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
      question: 'What is $OPENFUND?',
      answer: (
        <div className="space-y-3">
          <p>
            $OPENFUND is the OpenFund community token, live on pons on Robinhood Chain. This is the only
            official contract address — treat any other address claiming to be $OPENFUND as fake.
          </p>
          <ContractAddress />
        </div>
      ),
    },
  ];

  return (
    <div className="divide-y divide-border border-y border-border">
      {faqs.map((faq, index) => {
        const open = openIndex === index;
        return (
          <div key={faq.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className="text-[15px] font-medium text-foreground">{faq.question}</span>
              <span className="text-xl leading-none text-muted-foreground" aria-hidden="true">{open ? '−' : '+'}</span>
            </button>
            {open ? <div className="pb-6 pr-8 text-sm leading-relaxed text-muted-foreground">{faq.answer}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
