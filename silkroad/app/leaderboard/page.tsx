'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';

interface LeaderboardEntry {
  wallet: string;
  totalRaised: number;
  donationCount: number;
  activeCampaigns: number;
}

function LeaderboardPageContent() {
  const { isConnected, mounted } = useAuth();
  const { publicKey } = useWallet();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted) fetchLeaderboard();
  }, [mounted]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leaderboard?limit=20');
      setLeaderboard(response.data.leaderboard);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const truncateWallet = (wallet: string) =>
    wallet.length <= 12 ? wallet : `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  const isCurrentUser = (wallet: string) => publicKey?.toBase58() === wallet;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0f0d0a] px-4 py-12">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">
            🏆 Top Fundraisers
          </h1>
          <p className="text-lg text-white/50">
            The creators who have raised the most on OpenFund
          </p>
        </div>

        {/* Info banner */}
        {!isConnected && (
          <div className="mb-6 rounded-lg border border-orange-900/40 bg-orange-950/20 p-4">
            <p className="text-sm text-orange-300">
              <strong>👀 Browse Mode:</strong> Connect your wallet to create a fundraiser and appear on the leaderboard.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F97316] border-t-transparent"></div>
            <span className="ml-3 text-white/50">Loading...</span>
          </div>
        )}

        {/* Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-orange-900/30 bg-white/3 backdrop-blur-sm shadow-lg">
            <table className="min-w-full divide-y divide-orange-900/20">
              <thead className="bg-white/3">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/40">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/40">Creator</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-white/40">Total Raised</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-white/40">Donations</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-white/40">Active Campaigns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-900/20">
                {leaderboard.map((entry, index) => {
                  const isTop3 = index < 3;
                  const isMe = isCurrentUser(entry.wallet);
                  return (
                    <tr
                      key={entry.wallet}
                      className={`transition-colors ${
                        isTop3
                          ? 'bg-[#F97316]/8 border-l-4 border-[#F97316]'
                          : isMe
                          ? 'bg-orange-950/20'
                          : 'hover:bg-white/3'
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className={`text-lg font-bold ${isTop3 ? 'gradient-text' : 'text-white/60'}`}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-white">
                            {truncateWallet(entry.wallet)}
                          </code>
                          {isMe && (
                            <span className="rounded-full bg-orange-900/40 px-2 py-0.5 text-xs font-medium text-orange-300">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Raised */}
                      <td className="px-6 py-4 text-right">
                        <div className="text-xl font-bold text-[#FBBF24]">
                          ${entry.totalRaised.toFixed(2)}
                        </div>
                        <div className="text-xs text-white/40">USDC</div>
                      </td>

                      {/* Donations */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-white/8 px-3 py-1 text-sm font-semibold text-white/70">
                          {entry.donationCount}
                        </span>
                      </td>

                      {/* Active Campaigns */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-white/8 px-3 py-1 text-sm font-semibold text-white/70">
                          {entry.activeCampaigns}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!loading && leaderboard.length === 0 && (
          <div className="rounded-xl border border-orange-900/30 bg-white/3 p-16 text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">No fundraisers yet</h3>
            <p className="text-sm text-white/50">Be the first to launch a campaign and claim the top spot!</p>
          </div>
        )}

        {/* How rankings work */}
        <div className="mt-8 rounded-xl border border-orange-900/30 bg-orange-950/10 p-6">
          <h3 className="mb-3 text-sm font-bold text-[#FBBF24]">📊 How Rankings Work</h3>
          <ul className="space-y-1 text-sm text-white/60">
            <li>• Ranked by <strong className="text-white/80">total USDC raised</strong> across all campaigns</li>
            <li>• Only completed (successful) donations count toward totals</li>
            <li>• Rankings update in real-time as donations come in</li>
            <li>• Your rank is highlighted when your wallet appears on the board</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardPageContent />;
}
