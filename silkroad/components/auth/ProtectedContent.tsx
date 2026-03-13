'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

/**
 * ProtectedContent Component
 *
 * Wraps content that requires token gating + TOS acceptance.
 * Blocks rendering until both requirements are met.
 */
export function ProtectedContent({ children }: { children: ReactNode }) {
  const { isConnected, hasAcceptedTOS, isLoading, mounted } = useAuth();

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0d0a]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F97316] border-t-transparent mx-auto mb-4"></div>
          <p className="text-white/50">Checking access...</p>
        </div>
      </div>
    );
  }

  // Block content if not connected
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0d0a] px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-white/50">
            Please connect your wallet to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Block content if TOS not accepted
  if (!hasAcceptedTOS) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0d0a] px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📜</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Terms of Service Required
          </h2>
          <p className="text-white/50">
            Please review and accept the Terms of Service to continue.
          </p>
        </div>
      </div>
    );
  }

  // All checks passed - render protected content
  return <>{children}</>;
}
