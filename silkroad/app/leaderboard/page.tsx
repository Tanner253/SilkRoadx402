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
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
            🏆 Top Fundraisers
          </h1>
          <p className="text-lg text-muted-foreground">
            The creators who have raised the most on OpenFund
          </p>
        </div>

        {/* Info banner */}


        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-transparent"></div>
            <span className="ml-3 text-muted-foreground">Loading...</span>
          </div>
        )}

        {/* Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-muted backdrop-blur-sm shadow-lg">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Creator</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Raised</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Donations</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Campaigns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.map((entry, index) => {
                  const isTop3 = index < 3;
                  const isMe = isCurrentUser(entry.wallet);
                  return (
                    <tr
                      key={entry.wallet}
                      className={`transition-colors ${
                        isTop3
                          ? 'bg-accent border-l-4 border-border'
                          : isMe
                          ? 'bg-accent'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className={`text-lg font-bold ${isTop3 ? 'gradient-text' : 'text-muted-foreground'}`}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-foreground">
                            {truncateWallet(entry.wallet)}
                          </code>
                          {isMe && (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Raised */}
                      <td className="px-6 py-4 text-right">
                        <div className="text-xl font-bold text-primary">
                          ${entry.totalRaised.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">USDC</div>
                      </td>

                      {/* Donations */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
                          {entry.donationCount}
                        </span>
                      </td>

                      {/* Active Campaigns */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
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
          <div className="rounded-xl border border-border bg-muted p-16 text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No fundraisers yet</h3>
            <p className="text-sm text-muted-foreground">Be the first to launch a campaign and claim the top spot!</p>
          </div>
        )}

        {/* How rankings work */}
        <div className="mt-8 rounded-xl border border-border bg-accent p-6">
          <h3 className="mb-3 text-sm font-bold text-primary">📊 How Rankings Work</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Ranked by <strong className="text-foreground">total USDC raised</strong> across all campaigns</li>
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
