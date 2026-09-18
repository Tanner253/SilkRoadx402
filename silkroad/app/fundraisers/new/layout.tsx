import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start a fundraiser',
  description: 'Start a fundraiser in minutes. No account, no review queue — just the wallet you want donations sent to.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
