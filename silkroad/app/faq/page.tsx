import { FAQ } from '@/components/home/FAQ';
import { PageIntro } from '@/components/fundraisers/ui';

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-[820px] px-6 pb-24 md:px-8">
      <PageIntro eyebrow="FAQ" title="Questions," accent="answered." />
      <FAQ />
    </div>
  );
}
