'use client';

/** The $OPEN contract address with copy and explorer buttons. */

import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { PLATFORM_TOKEN } from '@/config/platform';
import { explorerAddressUrl } from '@/lib/chain/network';

export function ContractAddress({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const address = PLATFORM_TOKEN.contractAddress;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — the address is still selectable */
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <code className="min-w-0 flex-1 break-all font-mono text-[13px] leading-snug text-primary">{address}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy contract address'}
        title={copied ? 'Copied' : 'Copy'}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <a
        href={explorerAddressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View contract on the Robinhood Chain explorer"
        title="View on explorer"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ArrowUpRight size={15} />
      </a>
    </div>
  );
}
