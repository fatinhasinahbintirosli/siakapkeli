import { publicDb } from '@/lib/db';
import { SITE_DESC, SITE_NAME, SITE_URL } from '@/lib/site';

export const revalidate = 600;

const x = (s: string) => (s || '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));

export async function GET() {
  const { data } = await publicDb().from('posts').select('title, slug, excerpt, published_at, image_url')
    .eq('status', 'published').order('published_at', { ascending: false }).limit(30);
  const items = (data || []).map((p) => `
    <item>
      <title>${x(p.title)}</title>
      <link>${SITE_URL}/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/${p.slug}</guid>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      <description>${x(p.excerpt || '')}</description>
      ${p.image_url ? `<enclosure url="${x(p.image_url)}" type="image/jpeg" length="0"/>` : ''}
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${x(SITE_NAME)}</title><link>${SITE_URL}</link><description>${x(SITE_DESC)}</description><language>ms-my</language>
  ${items}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
