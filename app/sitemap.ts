import type { MetadataRoute } from 'next';
import { publicDb } from '@/lib/db';
import { SITE_URL } from '@/lib/site';

export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = publicDb();
  const [{ data: posts }, { data: cats }] = await Promise.all([
    db.from('posts').select('slug, updated_at, image_url').eq('status', 'published')
      .order('published_at', { ascending: false }).limit(5000),
    db.from('categories').select('slug'),
  ]);
  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    ...(cats || []).map((c) => ({ url: `${SITE_URL}/kategori/${c.slug}`, changeFrequency: 'hourly' as const, priority: 0.7 })),
    ...(posts || []).map((p) => ({
      url: `${SITE_URL}/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'weekly' as const, priority: 0.8,
      images: p.image_url ? [p.image_url] : undefined,
    })),
  ];
}
