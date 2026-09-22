import { getGift } from '@/lib/gifts';
import { GIFT_CARD_SIZE, giftCardImage, loadCover } from '@/lib/giftCard';

export const runtime = 'nodejs';
export const size = GIFT_CARD_SIZE;
export const contentType = 'image/png';
export const alt = 'A verified donation on OpenFund';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gift = await getGift(id).catch(() => null);
  if (!gift) {
    // Unknown or hidden gift: show the site's regular share card instead.
    return new Response(null, { status: 302, headers: { location: '/images/brand/openfund-og-1200x630.png' } });
  }
  return giftCardImage({
    donor: gift.donor,
    amount: gift.amount,
    title: gift.fundraiser.title,
    raised: gift.fundraiser.raised,
    goal: gift.fundraiser.goal,
    cover: await loadCover(gift.fundraiser.imageUrl),
  });
}
