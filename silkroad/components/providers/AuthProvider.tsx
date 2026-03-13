'use client';

import { useAuth } from '@/hooks/useAuth';
import { TOSModal } from '@/components/modals/TOSModal';
import { X403Modal } from '@/components/modals/X403Modal';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    showTOSModal,
    acceptTOS,
    declineTOS,
    x403,
  } = useAuth();

  return (
    <>
      {/* x403 Auth Modal - Priority 0: Required BEFORE anything else */}
      <X403Modal
        isOpen={x403.showAuthModal}
        onSign={x403.handleAuthSign}
        onCancel={x403.handleAuthCancel}
        isLoading={x403.isAuthenticating}
        error={x403.authError}
        challengeMessage={x403.authChallenge?.message}
      />

      {/* Global TOS Modal - Priority 1: Shown if TOS not accepted */}
      <TOSModal
        isOpen={showTOSModal}
        onAccept={acceptTOS}
        onDecline={declineTOS}
      />
      
      {children}
    </>
  );
}

