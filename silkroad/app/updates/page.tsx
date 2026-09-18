import { Updates } from '@/components/home/Updates';
import { PageIntro } from '@/components/fundraisers/ui';

export default function UpdatesPage() {
  return (
    <div className="mx-auto max-w-[900px] px-6 pb-24 md:px-8">
      <PageIntro eyebrow="UPDATES" title="What's" accent="new." />
      <Updates />
    </div>
  );
}
