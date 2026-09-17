'use client';

import { useAuth } from '@/hooks/useAuth';
import { X403Modal } from '@/components/modals/X403Modal';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { x403 } = useAuth();

  return (
    <>
      <X403Modal
        isOpen={x403.showAuthModal}
        onSign={x403.handleAuthSign}
        onCancel={x403.handleAuthCancel}
        isLoading={x403.isAuthenticating}
        error={x403.authError}
        challengeMessage={x403.authChallenge?.message}
      />
      {children}
    </>
  );
}

