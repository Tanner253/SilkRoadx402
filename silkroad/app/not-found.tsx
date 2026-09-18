import Link from 'next/link';
import { PiggyBank } from '@/components/mascot/PiggyBank';
import { primaryButtonClass } from '@/components/fundraisers/ui';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-24 pt-6 text-center">
      <PiggyBank pose="sleep" size={220} />
      <h1 className="mb-2 mt-4 text-3xl font-[450] tracking-[-0.03em] text-foreground">Nothing here.</h1>
      <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
        That page doesn&rsquo;t exist, or the campaign was removed.
      </p>
      <Link href="/fundraisers" className={primaryButtonClass}>
        Browse campaigns
      </Link>
    </div>
  );
}
