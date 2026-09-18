'use client';

/**
 * "You're leaving OpenFund" confirmation for every link to another site.
 *
 * One capture-phase listener on the document covers every external <a> on
 * every page — campaign links, explorer links, footer links — including
 * middle-clicks and keyboard activation, without each component opting in.
 * Links a campaign creator added (data-user-link) get an extra warning,
 * because nobody at OpenFund has checked them.
 *
 * Not covered: clicks inside third-party iframes (the YouTube player), which
 * the browser deliberately hides from the page.
 */

import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { isExternalUrl } from '@/lib/links';
import { primaryButtonClass, secondaryButtonClass } from '@/components/fundraisers/ui';

interface Pending {
  href: string;
  host: string;
  userAdded: boolean;
}

export function ExternalLinkGuard() {
  const [pending, setPending] = useState<Pending | null>(null);

  const intercept = useCallback((event: MouseEvent) => {
    if (event.defaultPrevented) return;
    if (event.type === 'auxclick' && event.button !== 1) return; // only middle-click
    const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor || anchor.hasAttribute('data-no-leave-warning')) return;
    const href = anchor.href;
    if (!isExternalUrl(href, window.location.host)) return;

    event.preventDefault();
    event.stopPropagation();
    let host = href;
    try {
      const u = new URL(href);
      host = u.protocol === 'mailto:' ? u.pathname : u.hostname.replace(/^www\./, '');
    } catch {
      /* keep the raw href */
    }
    setPending({ href, host, userAdded: anchor.hasAttribute('data-user-link') });
  }, []);

  useEffect(() => {
    document.addEventListener('click', intercept, true);
    document.addEventListener('auxclick', intercept, true);
    return () => {
      document.removeEventListener('click', intercept, true);
      document.removeEventListener('auxclick', intercept, true);
    };
  }, [intercept]);

  const leave = () => {
    if (!pending) return;
    if (pending.href.startsWith('mailto:')) window.location.href = pending.href;
    else window.open(pending.href, '_blank', 'noopener,noreferrer');
    setPending(null);
  };

  return (
    <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
      <DialogContent className="max-w-md border-border bg-card p-7">
        <div className="flex items-center gap-2 text-[#7a5a1c]">
          <ShieldAlert size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Leaving OpenFund</span>
        </div>
        <DialogTitle className="text-xl font-medium tracking-tight text-foreground">
          You&rsquo;re about to open <span className="break-all">{pending?.host}</span>
        </DialogTitle>
        <DialogDescription className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {pending?.userAdded ? (
            <span className="block">This link was added by the campaign&rsquo;s creator. OpenFund hasn&rsquo;t checked where it goes.</span>
          ) : null}
          <span className="block">
            OpenFund doesn&rsquo;t control other sites. Never enter your seed phrase or private key anywhere, and never
            &ldquo;connect&rdquo; your wallet to a site you don&rsquo;t trust — you don&rsquo;t need to connect it to donate.
          </span>
        </DialogDescription>
        <p className="break-all rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground">{pending?.href}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setPending(null)} className={secondaryButtonClass}>
            Stay on OpenFund
          </button>
          <button type="button" onClick={leave} className={primaryButtonClass} autoFocus>
            Continue <ArrowUpRight size={15} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
