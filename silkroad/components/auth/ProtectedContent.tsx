'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';
import { LaunchNotice } from '@/components/ui/LaunchNotice';

/**
 * ProtectedContent Component
 *
 * Wraps pages that still run on a connected Solana wallet (create, my
 * fundraisers, profile). The site no longer offers wallet connection, so
 * visitors get the launch notice; these pages come back wallet-less with the
 * Robinhood Chain migration.
 */
export function ProtectedContent({ children }: { children: ReactNode }) {
  const { isConnected, isLoading, mounted } = useAuth();

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <LaunchNotice subject="Fundraisers" withMascot />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
