import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top fundraisers',
  description: 'Creators ranked by verified donations on Robinhood Chain.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
