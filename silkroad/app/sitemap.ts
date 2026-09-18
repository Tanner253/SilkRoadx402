import type { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_APP_URL || 'https://openfund.fun';
  const pages: MetadataRoute.Sitemap = ['', '/fundraisers', '/fundraisers/new', '/leaderboard', '/faq', '/updates'].map((path) => ({
    url: `${site}${path}`,
    changeFrequency: 'daily',
  }));
  try {
    await connectDB();
    const live = await Fundraiser.find({ state: 'on_market', network: 'robinhood' })
      .select('_id updatedAt')
      .lean<{ _id: { toString(): string }; updatedAt?: Date }[]>();
    return [...pages, ...live.map((f) => ({ url: `${site}/fundraisers/${f._id.toString()}`, lastModified: f.updatedAt }))];
  } catch {
    return pages;
  }
}
