'use client';

import { useState } from 'react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is OpenFund?',
      answer: (
        <p>
          OpenFund is a pseudonymous, no-KYC crowdfunding platform built on Solana. Anyone with a
          Solana wallet can create a fundraiser or donate to a campaign — no identity verification,
          no bank accounts, no gatekeepers. Payments are made directly in USDC on-chain.
        </p>
      ),
    },
    {
      question: 'Do I need to sign up or verify my identity?',
      answer: (
        <>
          <p className="mb-3">
            <strong>No</strong> — there is zero sign-up. Your Solana wallet is your account.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>No email required</li>
            <li>No ID or KYC verification</li>
            <li>No personal information stored</li>
            <li>Connect your wallet → accept Terms → you&apos;re in</li>
          </ul>
        </>
      ),
    },
    {
      question: 'What wallet do I need?',
      answer: (
        <>
          <p className="mb-3">Any Solana-compatible wallet works. We recommend:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Phantom</strong> — most popular, sets up USDC automatically</li>
            <li><strong>Solflare</strong> — full SPL token support</li>
          </ul>
          <p className="mt-3 text-sm text-white/50">
            You&apos;ll also need a small amount of SOL for transaction fees (~$0.00025 per tx).
          </p>
        </>
      ),
    },
    {
      question: 'How do payments work?',
      answer: (
        <>
          <p className="mb-3">
            All donations are made in <strong>USDC on Solana</strong> and go <strong>directly</strong> to
            the fundraiser creator&apos;s wallet — no escrow, no platform intermediary.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Instant settlement (~400ms on Solana)</li>
            <li>Network fees are less than $0.001</li>
            <li>OpenFund takes <strong>0% of every donation</strong></li>
          </ul>
          <p className="mt-3 text-sm text-yellow-400 bg-yellow-950/20 border border-yellow-800/40 p-3 rounded">
            ⚠️ <strong>Donations are non-refundable.</strong> Do your research before donating to any campaign.
          </p>
        </>
      ),
    },
    {
      question: 'How do I start a fundraiser?',
      answer: (
        <ol className="list-decimal list-inside space-y-2">
          <li>Connect your Solana wallet and accept the Terms of Service</li>
          <li>Click <strong>&quot;Start a Fund&quot;</strong> in the navigation</li>
          <li>Fill in your campaign title, description, goal amount, and category</li>
          <li>Upload a campaign image</li>
          <li>Submit for admin review — approved campaigns go live on the platform</li>
        </ol>
      ),
    },
    {
      question: 'Who can see my fundraiser?',
      answer: (
        <>
          <p className="mb-3">
            All approved fundraisers are publicly visible on the <strong>Campaigns</strong> page.
            Your campaign will show:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Campaign title, description, and image</li>
            <li>Progress toward your goal</li>
            <li>Anonymized donor list (truncated wallet addresses)</li>
            <li>Your wallet address as the creator</li>
          </ul>
        </>
      ),
    },
    {
      question: 'Is this safe? How do I protect myself?',
      answer: (
        <>
          <p className="mb-3"><strong>Tips for donors:</strong></p>
          <ul className="list-disc list-inside space-y-2 mb-3">
            <li>Research the campaign creator&apos;s wallet history on Solscan</li>
            <li>Start with a small donation to test</li>
            <li>Use the 🚩 report button for suspicious campaigns</li>
            <li>Never share your wallet seed phrase with anyone</li>
          </ul>
          <p className="text-sm text-orange-400 bg-orange-950/20 border border-orange-900/50 p-3 rounded">
            ⚠️ OpenFund is a permissionless platform. We review campaigns but cannot guarantee outcomes.
            Only donate what you can afford to lose.
          </p>
        </>
      ),
    },
    {
      question: 'How do I report a suspicious campaign?',
      answer: (
        <ol className="list-decimal list-inside space-y-2">
          <li>Open the campaign detail page</li>
          <li>Click the flag icon 🚩 in the top-right corner</li>
          <li>Optionally add a reason</li>
          <li>Submit — our admins will review it</li>
        </ol>
      ),
    },
    {
      question: 'What happens if a campaign doesn\'t reach its goal?',
      answer: (
        <p>
          OpenFund uses a <strong>keep-what-you-raise</strong> model. All donations go directly to
          the creator&apos;s wallet instantly — there is no holding period or goal-based release.
          If a campaign doesn&apos;t reach its goal, the creator still keeps everything donated so far.
          This is by design: it means donors&apos; funds are never locked.
        </p>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-orange-900/30 bg-white/3 backdrop-blur-sm p-8">
      <h2 className="mb-8 text-3xl font-bold text-white">
        ❓ Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="rounded-lg border border-orange-900/30 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold text-white pr-4">{faq.question}</span>
              <span className="text-2xl text-white/40 flex-shrink-0">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-sm text-white/70 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
