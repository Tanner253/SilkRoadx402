'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PiggyBank } from '@/components/mascot/PiggyBank';
import { primaryButtonClass, secondaryButtonClass } from '@/components/fundraisers/ui';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-24 pt-6 text-center">
      <PiggyBank pose="sleep" size={220} />
      <h1 className="mb-2 mt-4 text-3xl font-[450] tracking-[-0.03em] text-foreground">Something went wrong.</h1>
      <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
        Sorry about that. Your donations are safe — nothing is ever held by OpenFund. Try again in a moment.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={reset} className={primaryButtonClass}>
          Try again
        </button>
        <Link href="/" className={secondaryButtonClass}>
          Home
        </Link>
      </div>
    </div>
  );
}
