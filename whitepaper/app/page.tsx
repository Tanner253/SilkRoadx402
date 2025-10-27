'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface TokenData {
  priceUsd: string;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidity?: number;
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const TOKEN_ADDRESS = '49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump';
  const PAIR_ADDRESS = '4dquGRPzcjskMsHtiFagPuguMfY37ywkNMNBg4F54fNW';
  
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        // Fetch from DexScreener API with cache busting
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/pairs/solana/${PAIR_ADDRESS}?t=${Date.now()}`,
          { cache: 'no-store' }
        );
        const data = await response.json();
        
        console.log('DexScreener data:', data);
        
        if (data.pair) {
          setTokenData({
            priceUsd: data.pair.priceUsd,
            marketCap: data.pair.fdv || data.pair.marketCap,
            volume24h: data.pair.volume.h24,
            priceChange24h: data.pair.priceChange.h24,
            liquidity: data.pair.liquidity?.usd
          });
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
      }
    };

    // Initial fetch
    fetchTokenData();
    setLoading(false);

    // Refresh every 2 seconds for faster updates
    const interval = setInterval(() => {
      fetchTokenData();
    }, 2000);

    return () => clearInterval(interval);
  }, [TOKEN_ADDRESS, PAIR_ADDRESS]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(TOKEN_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-black/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/correcto.png" 
              alt="SilkRoadx402 Logo" 
              width={40} 
              height={40}
              className="rounded"
              style={{ maxWidth: '40px', maxHeight: '40px' }}
            />
            <div className="text-2xl font-bold">
              <span className="text-green-400">Silk</span>
              <span className="text-cyan-400">Road</span>
              <span className="text-gray-500">x402</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/Tanner253" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="View on GitHub"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a 
              href="https://x.com/i/communities/1982622474983637154" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all inline-block"
            >
              Join X Community →
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          The <span className="gradient-text">Anonymous</span> Marketplace<br />
          for Private Software
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
          Sell your private tools, bots, and software to the world—no identity required. 
          Get paid instantly in USDC on Solana with x402 payments.
        </p>
        <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Zero KYC
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            Anonymous Listings
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Instant Payments
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            Near-Zero Fees
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            Legal Software Only
          </div>
        </div>
      </section>

      {/* What is x402? */}
      <section className="border-t border-gray-800 bg-gray-950/50">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold mb-4">What is <span className="text-cyan-400">x402</span>?</h2>
          <p className="text-gray-400 mb-8 max-w-3xl">
            x402 is an open protocol that makes the internet payable. Built on the HTTP 402 &quot;Payment Required&quot; status code, 
            it enables instant, wallet-based micropayments without accounts, subscriptions, or middlemen.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="border-glow bg-black/50 p-6 rounded">
              <h3 className="text-xl font-bold mb-3 text-green-400">How It Works</h3>
              <ol className="space-y-3 text-gray-400 list-decimal list-inside">
                <li>Buyer requests software download</li>
                <li>Server responds with <code className="text-cyan-400 bg-gray-900 px-2 py-0.5 rounded">HTTP 402</code> + payment details</li>
                <li>Wallet signs payment authorization (USDC on Solana)</li>
                <li>Transaction settles on-chain in &lt;1 second</li>
                <li>Software delivered instantly to buyer</li>
              </ol>
            </div>
            
            <div className="border-glow bg-black/50 p-6 rounded">
              <h3 className="text-xl font-bold mb-3 text-cyan-400">Why It&apos;s Powerful</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>No accounts:</strong> Pure wallet-based, anonymous by design</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Micro-fees:</strong> Solana costs $0.000005 per transaction</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Instant:</strong> Sub-second payment finality</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>AI-ready:</strong> Bots and agents can pay autonomously</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-900/50 border border-gray-800 rounded">
            <p className="text-sm text-gray-500 leading-relaxed">
              <strong className="text-gray-300">Technical Deep Dive:</strong> When your software is requested, 
              the server responds with a 402 status containing payment parameters (amount, recipient address, USDC mint, network). 
              The buyer&apos;s wallet (e.g., Phantom) signs a structured message following EIP-712/ed25519 standards with a nonce, 
              timestamp, and paymentId to prevent replay attacks. The signed payload is attached as an HTTP header on retry. 
              The server verifies the signature, broadcasts the SPL token transfer to Solana mainnet, and serves the download 
              link upon confirmation. No chargebacks, no accounts, no friction—just pure peer-to-peer commerce.
            </p>
          </div>
        </div>
      </section>

      {/* Why SilkRoadx402? */}
      <section className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold mb-4">Why <span className="gradient-text">SilkRoadx402</span>?</h2>
          <p className="text-gray-400 mb-12 max-w-3xl">
            Most marketplaces force you to reveal your identity, wait days for payments, and lose 15-30% to fees. 
            We&apos;re building the first truly anonymous, instant-settlement marketplace for developers.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-black/50 border border-gray-800 p-6 rounded">
              <div className="text-3xl mb-3">🎭</div>
              <h3 className="text-lg font-bold mb-2 text-green-400">Zero KYC Required</h3>
              <p className="text-gray-400 text-sm">
                No identity verification, no bank accounts, no tax forms. Just connect your Solana wallet with 50,000+ $SRx402 tokens and start selling. 
                Unlike traditional platforms (Gumroad, Stripe, PayPal) that require full KYC for sellers, SilkRoadx402 
                keeps you completely anonymous. Your wallet address is your only fingerprint.
              </p>
            </div>

            <div className="bg-black/50 border border-gray-800 p-6 rounded">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-bold mb-2 text-cyan-400">Instant Settlement</h3>
              <p className="text-gray-400 text-sm">
                Payments settle on Solana in under 1 second. Smart contract escrow auto-releases funds upon delivery—no 
                manual holds, no waiting periods. Money flows instantly.
              </p>
            </div>

            <div className="bg-black/50 border border-gray-800 p-6 rounded">
              <div className="text-3xl mb-3">💸</div>
              <h3 className="text-lg font-bold mb-2 text-purple-400">0.5% Fees</h3>
              <p className="text-gray-400 text-sm">
                Keep 99.5% of your revenue on standard listings. No payment processor fees, no platform cut, no hidden charges. 
                Just 0.5% to keep the marketplace running.
              </p>
            </div>

            <div className="bg-black/50 border border-gray-800 p-6 rounded">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-lg font-bold mb-2 text-yellow-400">AI Agent Ready</h3>
              <p className="text-gray-400 text-sm">
                x402 enables autonomous purchases. AI agents, trading bots, and automated systems can buy your software 
                without human intervention—opening massive M2M revenue streams.
              </p>
            </div>

            <div className="bg-black/50 border border-gray-800 p-6 rounded">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-bold mb-2 text-red-400">Encrypted Storage</h3>
              <p className="text-gray-400 text-sm">
                Files stored with client-side encryption. Only paying customers get the decryption keys. 
                Your intellectual property stays protected.
              </p>
            </div>

            <div className="bg-black/50 border border-gray-800 p-6 rounded">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="text-lg font-bold mb-2 text-green-400">Global Access</h3>
              <p className="text-gray-400 text-sm">
                Sell to anyone, anywhere, instantly. No geographic restrictions, no currency conversions, no payment gateway 
                rejections. If they have USDC, they can buy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Make Money */}
      <section className="border-t border-gray-800 bg-gray-950/50">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold mb-4">How to Make <span className="text-green-400">Money</span></h2>
          <p className="text-gray-400 mb-12 max-w-3xl">
            Turn your private tools into passive income. Whether it&apos;s a Solana trading bot, MEV script, 
            data scraper, or custom API—if it&apos;s valuable, people will pay for it.
          </p>

          <div className="space-y-6">
            <div className="bg-black/50 border-l-4 border-green-500 p-6 rounded">
              <h3 className="text-xl font-bold mb-2">1. List Your Software</h3>
              <p className="text-gray-400">
                Connect your wallet, upload your encrypted software, and sign the listing metadata with your private key. 
                Set your price in USDC—could be $0.10 or $10,000, your call. No KYC, no approval process, no waiting. 
                Start selling in 60 seconds.
              </p>
            </div>

            <div className="bg-black/50 border-l-4 border-cyan-500 p-6 rounded">
              <h3 className="text-xl font-bold mb-2">2. Buyers Pay via x402</h3>
              <p className="text-gray-400">
                When someone wants your software, they click &quot;Buy.&quot; x402 triggers their wallet to authorize payment. 
                Transaction settles on Solana in 400ms. They get the download link, you get paid instantly.
              </p>
            </div>

            <div className="bg-black/50 border-l-4 border-purple-500 p-6 rounded">
              <h3 className="text-xl font-bold mb-2">3. Collect Revenue 24/7</h3>
              <p className="text-gray-400">
                Your listing stays live. Every purchase sends USDC directly to your wallet—no withdrawals, no minimums. 
                Build it once, sell it repeatedly to buyers worldwide.
              </p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-br from-green-900/20 to-cyan-900/20 border border-green-500/30 rounded-lg">
            <h3 className="text-2xl font-bold mb-3">Example: Solana Sniper Bot</h3>
            <div className="grid md:grid-cols-2 gap-6 text-gray-300">
              <div>
                <div className="text-sm text-gray-500 mb-1">Listing Price</div>
                <div className="text-3xl font-bold text-green-400">$49.99</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Your Cut (99.5%)</div>
                <div className="text-3xl font-bold text-cyan-400">$49.74</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">100 Sales/Month</div>
                <div className="text-3xl font-bold text-purple-400">$4,974</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Annual Revenue</div>
                <div className="text-3xl font-bold text-yellow-400">$59,688</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              * Revenue potential varies by software quality, market demand, and pricing strategy. No guarantees.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold mb-12">What Can You <span className="gradient-text">Sell</span>?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🤖", title: "Trading Bots", desc: "MEV, arbitrage, snipers" },
              { icon: "🔧", title: "Dev Tools", desc: "CLIs, libraries, frameworks" },
              { icon: "📊", title: "Data Tools", desc: "Scrapers, parsers, analytics" },
              { icon: "🎨", title: "Design Assets", desc: "UI kits, templates, fonts" },
              { icon: "🔐", title: "Security Tools", desc: "Auditors, scanners, monitors" },
              { icon: "💻", title: "Scripts", desc: "Automation, deployment, testing" },
              { icon: "📱", title: "APIs", desc: "Custom endpoints, wrappers" },
              { icon: "🎮", title: "Game Mods", desc: "Plugins, enhancements, utilities" },
            ].map((item, i) => (
              <div key={i} className="bg-black/50 border border-gray-800 p-4 rounded text-center hover:border-green-500/30 transition-all">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-red-900/10 border border-red-500/30 rounded-lg">
            <h3 className="text-lg font-bold mb-2 text-red-400">⚠️ Legal Software Only</h3>
            <p className="text-gray-400 text-sm mb-3">
              SilkRoadx402 strictly prohibits the sale of any illegal software, malware, hacking tools intended for 
              unauthorized access, or software that violates United States regulations. All listings must comply with 
              applicable laws. Violators will be permanently banned and reported to authorities.
            </p>
            <p className="text-gray-400 text-sm">
              <strong className="text-red-300">Fee Structure:</strong> Standard software pays 0.5% fees. High-risk listings 
              (at platform discretion) incur a 35% fee, used exclusively for SRx402 token buyback/burn—not as platform profit. 
              We do not profit from any questionable software.
            </p>
          </div>
        </div>
      </section>

      {/* Token Section */}
      <section className="border-t border-gray-800 bg-gray-950/50">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold mb-4 text-center">
            <span className="gradient-text">$SRx402</span> Token
          </h2>
          <p className="text-gray-400 text-center mb-6 max-w-2xl mx-auto">
            Platform governance token and marketplace access key. 35% fees from high-risk listings are used exclusively for buyback & burn.
          </p>
          
          {/* Access Requirement Banner */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-green-900/30 via-cyan-900/30 to-purple-900/30 border-2 border-green-500/50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔑</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-green-400">Marketplace Access Required</h3>
                  <p className="text-gray-300 mb-3">
                    To list or purchase software on SilkRoadx402, you must hold a minimum of{' '}
                    <span className="text-cyan-400 font-bold">50,000 $SRx402</span> tokens in your connected wallet.
                  </p>
                  <p className="text-sm text-gray-400">
                    This requirement ensures platform quality, reduces spam listings, and creates sustainable token demand. 
                    Buyers and sellers both need the minimum holding to participate.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Chart */}
            <div className="bg-black/50 border border-gray-800 rounded-lg p-6 flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-green-400">Live Chart</h3>
              <div id="dexscreener-embed">
                <iframe src="https://dexscreener.com/solana/4dquGRPzcjskMsHtiFagPuguMfY37ywkNMNBg4F54fNW?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=marketCap&interval=1"></iframe>
              </div>
            </div>

            {/* Token Info */}
            <div className="flex flex-col gap-4">
              <div className="bg-black/50 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 text-cyan-400">Contract Address</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value="49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-300 text-sm font-mono"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded hover:bg-purple-500/20 transition-all whitespace-nowrap"
                  >
                    {copied ? '✓ Copied!' : 'Copy CA'}
                  </button>
                </div>
              </div>

              <div className="bg-black/50 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 text-purple-400">Token Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Symbol</span>
                    <span className="text-gray-300 font-bold">$SRx402</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Network</span>
                    <span className="text-gray-300">Solana</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Market Cap</span>
                    <span className="text-gray-300">
                      {loading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : tokenData?.marketCap ? (
                        formatNumber(tokenData.marketCap)
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                  {tokenData && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">24h Volume</span>
                        <span className="text-gray-300">
                          {formatNumber(tokenData.volume24h)}
                        </span>
                  </div>
                  <div className="flex justify-between items-center">
                        <span className="text-gray-500">24h Change</span>
                        <span className={tokenData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {tokenData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}%
                        </span>
                  </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2 text-purple-400">🔥 Burn Mechanism</h3>
                <p className="text-sm text-gray-400 mb-3">
                  35% fees from high-risk listings are used to buyback $SRx402 and burn it forever. 
                  This deflationary mechanism protects the platform from profiting off questionable software while 
                  increasing token scarcity over time.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-900/20 to-cyan-900/20 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2 text-green-400">🔐 Access Token</h3>
                <p className="text-sm text-gray-400">
                  Hold <span className="text-cyan-400 font-bold">50,000+ $SRx402</span> to access the marketplace. 
                  This paywall model ensures serious users, quality listings, and sustainable platform economics. 
                  Token holders become platform stakeholders.
                </p>
              </div>

              <a 
                href="https://pump.fun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded hover:from-purple-600 hover:to-pink-600 transition-all text-center"
              >
                Trade on pump.fun →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Start <span className="gradient-text">Selling</span>?</h2>
          <p className="text-xl text-gray-400 mb-4">
            Join the future of anonymous software commerce. Turn your code into cash.
          </p>
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 max-w-2xl mx-auto mb-10">
            <p className="text-sm text-gray-300">
              <strong className="text-cyan-400">Access Requirement:</strong> Hold 50,000+ $SRx402 tokens to use the marketplace
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://pump.fun" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-12 py-4 bg-purple-500 text-white font-bold text-lg rounded hover:bg-purple-400 transition-all"
            >
              Buy $SRx402 →
            </a>
          <a 
            href="https://x.com/i/communities/1982622474983637154" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-12 py-4 bg-green-500 text-black font-bold text-lg rounded hover:bg-green-400 transition-all border-glow"
          >
              Join Community →
          </a>
          </div>
          <p className="text-sm text-gray-600 mt-6">
            Platform launching Q4 2025
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image 
                  src="/correcto.png" 
                  alt="SilkRoadx402 Logo" 
                  width={24} 
                  height={24}
                  className="rounded"
                  style={{ maxWidth: '24px', maxHeight: '24px' }}
                />
                <h3 className="font-bold text-green-400">SilkRoadx402</h3>
              </div>
              <p className="text-sm text-gray-500">
                The first decentralized marketplace for private software sales using x402 payments on Solana.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-3">Technology</h3>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• x402 Payment Protocol</li>
                <li>• Solana Blockchain</li>
                <li>• Encrypted Cloud Storage</li>
                <li>• Client-Side Encryption</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Legal</h3>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• US Compliant</li>
                <li>• No Illegal Software</li>
                <li>• Peer-to-Peer Model</li>
                <li>• No Liability for Listings</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-900 pt-8">
            <p className="text-xs text-gray-600 text-center">
              SilkRoadx402 operates as a decentralized peer-to-peer marketplace. We do not host, verify, or guarantee any software listings. 
              Buyers and sellers interact directly via smart contracts. All transactions are final and non-refundable due to blockchain immutability.
            </p>
            <p className="text-xs text-gray-600 text-center mt-4">
              <strong>Platform Fees:</strong> 0.5% on standard software transactions. High-risk listings (determined at platform discretion) are subject to a 35% fee, 
              which is used exclusively for SRx402 token buyback and burn—not as platform profit. This protects the platform from liability associated with 
              potentially problematic software. Non-compliant or illegal software is strictly prohibited and will not be listed.
            </p>
            <div className="flex flex-col items-center gap-3 mt-6">
              <p className="text-xs text-gray-700 text-center">
                © 2025 SilkRoadx402. All rights reserved. Not affiliated with the original Silk Road.
              </p>
              <a 
                href="https://github.com/Tanner253" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Built by Tanner253
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

