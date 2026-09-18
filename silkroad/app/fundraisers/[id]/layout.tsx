import type { Metadata } from 'next';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';
import { decodeEscaped } from '@/lib/validation/sanitization';

type Props = { params: Promise<{ id: string }> };

/**
 * Link previews for a campaign (X, Telegram, iMessage…): its own title, a
 * short excerpt of the story, and its cover image. Rendered on the server
 * because crawlers don't run the client-side page.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const fallback: Metadata = { title: 'Campaign', robots: { index: false } };
  if (!isValidObjectId(id)) return fallback;

  try {
    await connectDB();
    const f = await Fundraiser.findById(id)
      .select('title description imageUrl state approved')
      .lean<{ title: string; description: string; imageUrl?: string; state: string; approved?: boolean }>();
    if (!f || (f.state === 'pulled' && f.approved === false)) return fallback;

    const title = decodeEscaped(f.title);
    const story = decodeEscaped(f.description).replace(/\s+/g, ' ').trim();
    const description = story.length > 180 ? `${story.slice(0, 177).trimEnd()}…` : story;
    const images = f.imageUrl ? [{ url: f.imageUrl, width: 1600, height: 900, alt: title }] : undefined;

    return {
      title,
      description,
      robots: f.state === 'pulled' ? { index: false } : undefined,
      openGraph: { type: 'article', title, description, images, url: `/fundraisers/${id}` },
      twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((i) => i.url) },
    };
  } catch {
    // Metadata must never break the page itself.
    return fallback;
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
