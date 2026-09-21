'use client';

import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Piggy } from '@/components/mascot/Piggy';
import { Reveal } from '@/components/motion/Reveal';
import { Parallax } from '@/components/motion/Parallax';
import { PLATFORM_TOKEN } from '@/config/platform';
import { ContractAddress } from '@/components/ContractAddress';
import './home.css';

export default function Home() {
  return (
    <div className="openfund-home">
      <section className="fund-hero" aria-labelledby="fund-title">
        <div className="fund-intro">
          <p className="fund-eyebrow fund-reveal"><span /> OPEN FUNDRAISING</p>
          <h1 id="fund-title" className="fund-reveal">Good things<br />start with<br /><em>a little.</em></h1>
          <p className="fund-description fund-reveal">Raise funds for what matters. Contributions go directly to your wallet, with no KYC.</p>
          <div className="fund-actions fund-reveal">
            <Link className="fund-button" href="/fundraisers/new">Start a fundraiser <ArrowUpRight size={18} /></Link>
            <Link className="fund-text-link" href="/fundraisers">Explore campaigns <ArrowRight size={17} /></Link>
          </div>
        </div>

        <div className="piggy-stage">
          <Parallax speed={54}>
            <Piggy pose="sleep" size={520} className="piggy-figure" />
          </Parallax>
          <p className="piggy-hint">Psst — she wakes up if you tap her.</p>
        </div>

        <div className="fund-scrollcue" aria-hidden="true"><span>Scroll</span><i /></div>
      </section>

      <section className="fund-statement" aria-labelledby="fund-what">
        <Reveal className="fund-statement-inner">
          <h2 id="fund-what">What a fundraiser is</h2>
          <p>
            A page for one thing you need money for. You set the goal and tell people
            why it matters. Anyone can chip in, from anywhere, in any amount. Every
            contribution lands in your wallet the moment it&rsquo;s made — there is no
            payout schedule to wait on, because there is no middle step.
          </p>
        </Reveal>
      </section>

      <section className="fund-statement fund-statement--right" aria-labelledby="fund-why">
        <Reveal className="fund-statement-inner">
          <h2 id="fund-why">Why it matters</h2>
          <p>
            Traditional platforms want your ID, your bank details and a cut of the
            total. They can freeze a campaign, and they decide which causes deserve a
            page. OpenFund asks for none of it. No KYC, no application, no fee taken
            out of what people gave you.
          </p>
        </Reveal>
      </section>

      <section className="fund-numbers" aria-label="How OpenFund works">
        <Reveal className="fund-numbers-grid" stagger={0.09}>
          <div className="fund-number"><span>01</span><h3>Make a page</h3><p>A title, the story, a goal. Two minutes.</p></div>
          <div className="fund-number"><span>02</span><h3>Share it</h3><p>One link. Nobody needs an account to give.</p></div>
          <div className="fund-number"><span>03</span><h3>Get paid</h3><p>Straight to your wallet, as it comes in.</p></div>
        </Reveal>
      </section>

      <section className="fund-start" aria-labelledby="fund-start-title">
        <Reveal><h2 id="fund-start-title">Where do you want to start?</h2></Reveal>
        <Reveal className="fund-start-grid" stagger={0.12}>
          <div className="fund-start-col">
            <Link className="fund-card" href="/fundraisers/new"><span>I need<br />to raise</span></Link>
            <Link className="fund-card-link" href="/fundraisers/new">Start a fundraiser <ArrowUpRight size={15} /></Link>
          </div>
          <div className="fund-start-col">
            <Link className="fund-card" href="/fundraisers"><span>I want<br />to give</span></Link>
            <Link className="fund-card-link" href="/fundraisers">Explore campaigns <ArrowUpRight size={15} /></Link>
          </div>
        </Reveal>
      </section>

      <details className="fund-token">
        <summary>${PLATFORM_TOKEN.ticker} <span>Details +</span></summary>
        <div>
          <p>OpenFund runs on Robinhood Chain (chain ID 4663), the network pons is built on. ${PLATFORM_TOKEN.ticker} is live on pons.</p>
          <p>Contract address</p>
          <ContractAddress className="max-w-[560px]" />
          <a href={PLATFORM_TOKEN.launchpadUrl} target="_blank" rel="noopener noreferrer">Explore pons <ArrowUpRight size={14} /></a>
        </div>
      </details>
    </div>
  );
}
