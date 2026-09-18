import type { Metadata } from 'next';

export const metadata: Metadata = {
  // A plain string here would reset the root '%s · OpenFund' template for
  // every page below /fundraisers, so set both explicitly.
  title: { absolute: 'Campaigns · OpenFund', template: '%s · OpenFund' },
  description: 'Find a cause worth backing. Every OpenFund campaign goes straight to its creator’s wallet.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
