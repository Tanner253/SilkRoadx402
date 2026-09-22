/**
 * Render a sample "I gave" share card to a PNG — for checking the design and
 * for marketing posts. Uses the exact renderer the live /gift pages use.
 *
 *   npx tsx scripts/generate-gift-demo.tsx <out.png> [amount] [title] [raised] [goal] [coverUrl] [donor]
 */

import { writeFile } from 'node:fs/promises';
import { giftCardImage, loadCover } from '@/lib/giftCard';

async function main() {
  const [out = 'gift-demo.png', amount = '0.05', title = 'Shelter beds for winter', raised = '0.84', goal = '1.2', cover, donor] = process.argv.slice(2);
  const image = await giftCardImage({
    donor: donor ?? '0x7a3F9c21E0b5D4a6C8e1f2A3b4C5d6E7F8091b2C',
    amount: Number(amount),
    title,
    raised: Number(raised),
    goal: Number(goal),
    cover: await loadCover(cover ?? 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b'),
  });
  await writeFile(out, Buffer.from(await image.arrayBuffer()));
  console.log('wrote', out);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
