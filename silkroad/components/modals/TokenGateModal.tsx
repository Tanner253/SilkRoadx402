'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { CONFIG } from '@/config/constants';

interface TokenGateModalProps {
  isOpen: boolean;
  currentBalance?: number;
  requiredBalance: number;
}

export function TokenGateModal({ isOpen, currentBalance = 0, requiredBalance }: TokenGateModalProps) {
  const { disconnect } = useWallet();
  const buyChartUrl = CONFIG.OPEN_DEXSCREENER_URL;

  const handleBuyTokens = () => {
    window.open(buyChartUrl, '_blank');
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (!isOpen) return null;

  const shortage = requiredBalance - currentBalance;
  const formattedBalance = currentBalance.toLocaleString();
  const formattedRequired = requiredBalance.toLocaleString();
  const formattedShortage = shortage.toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl shadow-none mx-4">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent border border-border">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            🔒 Token Gating Required
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            OpenFund requires holding $OPEN tokens for access
          </p>
        </div>

        {/* Balance Info */}
        <div className="mb-6 rounded-lg border border-border bg-accent p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Balance:</span>
              <span className="font-mono font-semibold text-foreground">
                {formattedBalance} $OPEN
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required:</span>
              <span className="font-mono font-semibold text-foreground">
                {formattedRequired} $OPEN
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="font-medium text-primary">Need to Buy:</span>
                <span className="font-mono font-bold text-primary">
                  {formattedShortage} $OPEN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mb-6 rounded-lg border border-border bg-accent p-4">
          <p className="text-sm text-primary">
            <strong>ℹ️ How to get access:</strong>
          </p>
          <ol className="mt-2 ml-4 space-y-1 text-sm text-muted-foreground list-decimal">
            <li>Buy $OPEN tokens (see chart link below)</li>
            <li>Send tokens to your connected wallet</li>
            <li>Reconnect your wallet to refresh balance</li>
            <li>Start using the platform!</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleBuyTokens}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary transition-colors shadow-lg"
          >
            📈 View chart / Buy $OPEN
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>

        {/* Contract Info */}
        <div className="mt-4 rounded border border-border bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-1">
            <strong>Token Contract:</strong>
          </p>
          <p className="text-xs font-mono text-muted-foreground break-all">
            {CONFIG.OPEN_TOKEN_MINT}
          </p>
        </div>
      </div>
    </div>
  );
}
