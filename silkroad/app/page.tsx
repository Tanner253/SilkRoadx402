'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

const PiggyScene = dynamic(
  () => import('@/components/home/PiggyScene').then((m) => m.PiggyScene),
  { ssr: false, loading: () => null }
);

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null;

export default function Home() {
  const { isConnected, hasAcceptedTOS, mounted } = useAuth();
  const { setVisible: openWallet } = useWalletModal();

  // Don't show wallet-state-dependent nav until hydrated — avoids flicker
  const ready = mounted;

  return (
    <>
      <style>{`
        @keyframes menu-glow {
          0%,100%{ text-shadow: 0 0 12px rgba(251,191,36,0.5), 0 0 24px rgba(249,115,22,0.3); }
          50%    { text-shadow: 0 0 22px rgba(251,191,36,1),   0 0 45px rgba(249,115,22,0.55), 0 0 70px rgba(249,115,22,0.2); }
        }
        @keyframes fade-in-up  { from{ opacity:0; transform:translateY(28px); } to{ opacity:1; transform:translateY(0); } }
        @keyframes slide-right { from{ opacity:0; transform:translateX(-24px); } to{ opacity:1; transform:translateX(0); } }

        .menu-glow  { animation: menu-glow 2.2s ease-in-out infinite; }
        .fade-up    { animation: fade-in-up  0.75s ease-out both; }
        .slide-right{ animation: slide-right 0.65s ease-out both; }
      `}</style>

      {/* Full-viewport, non-scrollable */}
      <div
        className="relative overflow-hidden"
        style={{ height: 'calc(100vh - 4rem)', background: '#020308' }}
      >
        {/* Space gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 68% 48%, #0d0420 0%, #040210 40%, #020308 100%)',
          }}
        />

        {/* Subtle tech grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(249,115,22,0.016) 1px, transparent 1px),
              linear-gradient(90deg, rgba(249,115,22,0.016) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Piggy bank scene */}
        <PiggyScene />

        {/* ─── UI OVERLAY ─── */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-5 sm:p-12 lg:p-16 pointer-events-none">

          {/* TOP — branding */}
          <div>
            <p className="slide-right text-[9px] tracking-[0.55em] text-orange-500/40 font-mono uppercase mb-3" style={{ animationDelay: '0.05s' }}>
              ◈ Mission Control — System Online
            </p>

            <div className="fade-up" style={{ animationDelay: '0.15s' }}>
              <h1 className="font-black leading-[0.88] tracking-tight">
                <span
                  className="block"
                  style={{
                    fontSize: 'clamp(3rem, 10vw, 7.5rem)',
                    background: 'linear-gradient(135deg, #fde68a 0%, #FBBF24 30%, #F97316 70%, #dc2626 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 28px rgba(249,115,22,0.55))',
                  }}
                >
                  OPEN
                </span>
                <span
                  className="block text-white"
                  style={{
                    fontSize: 'clamp(3rem, 10vw, 7.5rem)',
                    filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.22))',
                  }}
                >
                  FUND
                </span>
              </h1>
            </div>

            {/* P2P tagline */}
            <div className="fade-up mt-4 flex flex-wrap gap-2" style={{ animationDelay: '0.28s' }}>
              {['⚡ Instant Payment', 'P2P Direct', '∞ No Withdrawal Limits'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-orange-700/40 bg-orange-950/30 px-3 py-1 text-[11px] font-bold tracking-wide text-[#FBBF24]/80"
                >
                  {t}
                </span>
              ))}
            </div>

            <p className="fade-up mt-3 text-sm text-white/30 font-mono max-w-xs" style={{ animationDelay: '0.38s' }}>
              No banks. No bureaucracy. No KYC.
            </p>
          </div>

          {/* BOTTOM — game menu + HUD */}
          <div className="pointer-events-auto">
            <nav className="mb-8 space-y-1 fade-up" style={{ animationDelay: '0.45s' }}>
              {!ready || !isConnected ? (
                <>
                  <button onClick={() => openWallet(true)} className="group flex items-center gap-4 w-full text-left">
                    <span className="menu-glow text-[#FBBF24] font-mono text-2xl w-8 shrink-0">▶</span>
                    <span
                      className="menu-glow font-black tracking-[0.18em] text-[#FBBF24] group-hover:text-white transition-colors"
                      style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}
                    >
                      CONNECT WALLET
                    </span>
                  </button>
                  <Link href="/fundraisers" className="group flex items-center gap-4">
                    <span className="font-mono text-2xl w-8 text-white/20 group-hover:text-white/50 transition-colors shrink-0">▷</span>
                    <span className="font-black tracking-[0.18em] text-white/35 group-hover:text-white/75 transition-colors" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}>BROWSE CAMPAIGNS</span>
                  </Link>
                </>
              ) : hasAcceptedTOS ? (
                <>
                  <Link href="/fundraisers/new" className="group flex items-center gap-4">
                    <span className="menu-glow text-[#FBBF24] font-mono text-2xl w-8 shrink-0">▶</span>
                    <span
                      className="menu-glow font-black tracking-[0.18em] text-[#FBBF24] group-hover:text-white transition-colors"
                      style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}
                    >
                      NEW MISSION
                    </span>
                  </Link>
                  <Link href="/fundraisers" className="group flex items-center gap-4">
                    <span className="font-mono text-2xl w-8 text-white/20 group-hover:text-white/50 transition-colors shrink-0">▷</span>
                    <span className="font-black tracking-[0.18em] text-white/35 group-hover:text-white/75 transition-colors" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}>ACTIVE MISSIONS</span>
                  </Link>
                </>
              ) : (
                <Link href="/fundraisers" className="group flex items-center gap-4">
                  <span className="menu-glow text-[#FBBF24] font-mono text-2xl w-8 shrink-0">▶</span>
                  <span className="menu-glow font-black tracking-[0.18em] text-[#FBBF24] group-hover:text-white transition-colors" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>BROWSE MISSIONS</span>
                </Link>
              )}

              <Link href="/leaderboard" className="group flex items-center gap-4">
                <span className="font-mono text-2xl w-8 text-white/20 group-hover:text-white/50 transition-colors shrink-0">▷</span>
                <span className="font-black tracking-[0.18em] text-white/35 group-hover:text-white/75 transition-colors" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}>HALL OF FAME</span>
              </Link>

              <Link href="/faq" className="group flex items-center gap-4">
                <span className="font-mono text-2xl w-8 text-white/15 group-hover:text-white/40 transition-colors shrink-0">▷</span>
                <span className="font-black tracking-[0.18em] text-white/20 group-hover:text-white/55 transition-colors" style={{ fontSize: 'clamp(0.85rem, 2vw, 1.1rem)' }}>INTEL</span>
              </Link>
            </nav>

            {/* HUD */}
            <div className="fade-up flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-mono border-t border-orange-900/25 pt-3" style={{ animationDelay: '0.65s' }}>
              {[
                { k: 'FEE',        v: '0.000%', c: 'text-green-400'  },
                { k: 'KYC',        v: 'NONE',   c: 'text-red-400'    },
                { k: 'CHAIN',      v: 'SOLANA', c: 'text-[#F97316]'  },
                { k: 'SETTLEMENT', v: 'INSTANT',c: 'text-[#FBBF24]'  },
              ].map(({ k, v, c }) => (
                <span key={k} className="text-white/25">
                  {k}: <span className={c}>{v}</span>
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-green-400/70">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                ONLINE
              </span>
            </div>

            {CONTRACT_ADDRESS && (
              <p className="mt-2 text-[9px] font-mono text-white/15">
                CA: <span className="text-orange-500/40">{CONTRACT_ADDRESS}</span>
              </p>
            )}
          </div>
        </div>

        {/* Corner decorations */}
        {[
          { cls: 'top-0 right-0',   d: 'M80,0 L80,3 L3,80 L0,80 L0,0 Z',   fill: 'rgba(249,115,22,0.18)' },
          { cls: 'bottom-0 left-0', d: 'M0,80 L0,77 L77,0 L80,0 L80,80 Z', fill: 'rgba(249,115,22,0.18)' },
        ].map((c, i) => (
          <div key={i} className={`absolute pointer-events-none z-30 ${c.cls}`}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d={c.d} fill={c.fill} />
            </svg>
          </div>
        ))}

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'radial-gradient(ellipse at 28% 50%, transparent 35%, rgba(1,1,6,0.72) 100%)' }}
        />
      </div>
    </>
  );
}
