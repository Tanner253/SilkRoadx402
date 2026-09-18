import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Updates', description: 'What’s new on OpenFund.' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
