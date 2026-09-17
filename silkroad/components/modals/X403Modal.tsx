'use client';

interface X403ModalProps {
  isOpen: boolean;
  onSign: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
  challengeMessage?: string;
}

export function X403Modal({ isOpen, onSign, onCancel, isLoading, error, challengeMessage }: X403ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative border border-border bg-background rounded-3xl shadow-2xl shadow-none max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-accent p-4 md:p-6 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <svg className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground">
              Security Verification Required
            </h2>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            x403 Protocol — Secure Wallet Authentication
          </p>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-3 md:space-y-4 overflow-y-auto flex-1">
          {/* Explanation */}
          <div className="border border-border bg-accent rounded-xl p-3 md:p-4">
            <h3 className="text-sm font-bold text-primary mb-2">
              🛡️ Why This Is Safe:
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong className="text-foreground">NOT a transaction</strong> — Costs $0, no blockchain interaction</li>
              <li>• <strong className="text-foreground">Just verification</strong> — Proves you own this wallet</li>
              <li>• <strong className="text-foreground">No fund access</strong> — This signature cannot move your money</li>
              <li>• <strong className="text-foreground">Standard protocol</strong> — Industry-standard x403 authentication</li>
            </ul>
          </div>

          {/* Benefits */}
          <div className="border border-border bg-accent rounded-xl p-3 md:p-4">
            <h3 className="text-sm font-bold text-primary mb-2">
              ✅ How x403 Protects SOLk Road:
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Prevents bot spam and fake listings</li>
              <li>✓ Stops scammers from mass account creation</li>
              <li>✓ Ensures fair marketplace access</li>
              <li>✓ One wallet = one verified session</li>
            </ul>
          </div>

          {/* Authorization */}
          <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-3 md:p-4">
            <h3 className="text-sm font-bold text-yellow-700 mb-2">
              📜 By Signing, You Authorize:
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Create a 30-minute authentication session</li>
              <li>• Verify you&apos;re a real human user</li>
              <li>• Access the marketplace features</li>
              <li>• Prevent unfair bot activity</li>
            </ul>
          </div>

          {/* Security Warning */}
          <div className="border-2 border-red-200 bg-red-50 rounded-xl p-3 md:p-4">
            <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
              ⚠️ SECURITY: Verify Domain
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              <strong className="text-red-700">Always check the domain before signing!</strong>
            </p>
            <div className="bg-muted rounded px-3 py-2 font-mono text-xs text-foreground break-all">
              {typeof window !== 'undefined' ? window.location.hostname : 'solkroad.fun'}
            </div>
            <p className="text-xs text-red-700 mt-2">
              ✗ Never sign if the domain looks suspicious!
            </p>
          </div>

          {/* Technical Details (Collapsible) */}
          {challengeMessage && (
            <details className="bg-muted border border-border rounded-lg p-3">
              <summary className="text-xs font-bold text-primary cursor-pointer hover:text-primary">
                🔍 View Full Message (Advanced)
              </summary>
              <pre className="mt-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {challengeMessage}
              </pre>
            </details>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}

          {/* Session Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>⏰ You have 3 minutes to read and sign this challenge</div>
            <div>🔒 Session lasts 30 minutes after signing</div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4 md:p-6 flex gap-3 shrink-0">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-muted hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSign}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary text-primary-foreground rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-none"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-transparent" />
                Signing...
              </>
            ) : (
              <>
                <span>✍️</span>
                Sign & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
