import { publicDb } from '@/lib/db';
import { SITE_NAME, SITE_URL } from '@/lib/site';

// Sitemap Google News: hanya artikel 48 jam terakhir (syarat Google News), maksimum 1000.
// Dikemas kini setiap 5 minit supaya artikel baru cepat ditemui Google.
export const revalidate = 300;

const x = (s: string) => (s || '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));

export async function GET() {
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data } = await publicDb().from('posts').select('title, slug, published_at, image_url, tags')
    .eq('status', 'published').gte('published_at', since)
    .order('published_at', { ascending: false }).limit(1000);

  const urls = (data || []).map((p) => `
  <url>
    <loc>${SITE_URL}/${x(p.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${x(SITE_NAME)}</news:name>
        <news:language>ms</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.published_at).toISOString()}</news:publication_date>
      <news:title>${x(p.title)}</news:title>${p.tags?.length ? `
      <news:keywords>${x(p.tags.slice(0, 6).join(', '))}</news:keywords>` : ''}
    </news:news>${p.image_url ? `
    <image:image><image:loc>${x(p.image_url)}</image:loc></image:image>` : ''}
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}
</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
