import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Top donors and top fundraisers, ranked by verified donations on Robinhood Chain.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
