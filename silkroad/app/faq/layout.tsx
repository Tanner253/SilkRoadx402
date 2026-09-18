import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'How OpenFund works: giving without connecting a wallet, Robinhood Chain, manage links and safety.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
