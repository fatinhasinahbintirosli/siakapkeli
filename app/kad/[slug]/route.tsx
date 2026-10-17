import { ImageResponse } from 'next/og';
import { getPost } from '@/lib/db';
import { SITE_NAME, SITE_URL } from '@/lib/site';

// Kad gambar 1080×1350 untuk Facebook (gaya "quote card"): siakapkeli.me/kad/<slug>
// Dijana automatik dari tajuk + gambar artikel, kemudian disimpan dalam cache CDN.
export const revalidate = 86400;

const W = 1080, H = 1350;
const domain = SITE_URL.replace(/^https?:\/\//, '');

// Muat font Inter dari Google Fonts (hanya huruf yang digunakan — fail kecil & laju)
async function loadFont(weight: number, text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch { return null; }
}

// Gambar artikel → data URL JPEG.
// Penjana kad hanya faham JPG/PNG, jadi WebP/AVIF/GIF (biasa di portal berita) ditukar dulu dengan sharp.
async function loadPhoto(url?: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').toLowerCase();
    const original = Buffer.from(await res.arrayBuffer());
    if (/image\/(jpe?g|png)/.test(type) && original.length < 4_000_000) {
      return `data:${type.split(';')[0]};base64,${original.toString('base64')}`;
    }
    const sharp = (await import('sharp')).default;
    const converted = await sharp(original).resize({ width: 1080, height: 1000, fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${converted.toString('base64')}`;
  } catch (e) {
    console.error('Kad: gagal muat gambar', url, e);
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug.replace(/\.png$/, ''));
  if (!post) return new Response('Tidak dijumpai', { status: 404 });

  const title = post.title.length > 110 ? post.title.slice(0, 107).trimEnd() + '…' : post.title;
  const size = title.length <= 45 ? 76 : title.length <= 70 ? 66 : title.length <= 90 ? 58 : 52;
  const cat = post.categories?.name?.toUpperCase() || 'TERKINI';
  const [brandA, ...brandB] = SITE_NAME.split(' ');
  const allText = `${title}${SITE_NAME}@${domain}${cat}“BERITA VIRAL·TERKINIBACA DI KOMEN 👇0123456789`;

  const [photo, f800, f500] = await Promise.all([
    loadPhoto(post.image_url || post.image_thumb),
    loadFont(800, allText),
    loadFont(500, allText),
  ]);
  const fonts = [
    ...(f800 ? [{ name: 'Inter', data: f800, weight: 800 as const, style: 'normal' as const }] : []),
    ...(f500 ? [{ name: 'Inter', data: f500, weight: 500 as const, style: 'normal' as const }] : []),
  ];

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', background: '#0A0A0A', fontFamily: 'Inter' }}>
        {/* Bahagian atas: jenama + tajuk */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '56px 64px 48px', background: '#0A0A0A' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, background: '#FF3E00', transform: 'rotate(45deg)', borderRadius: 4, marginRight: 24 }} />
            <div style={{ display: 'flex', fontSize: 46, fontWeight: 800, color: '#FAFAFA', letterSpacing: -1 }}>
              {brandA}
              {brandB.length > 0 && <span style={{ color: '#FF3E00', marginLeft: 12 }}>{brandB.join(' ')}</span>}
            </div>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 500, color: '#6B7280', marginLeft: 20 }}>@{domain}</div>
          </div>
          <div style={{ display: 'flex', marginTop: 40 }}>
            <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, color: '#FF3E00', lineHeight: 0.8, marginRight: 22, marginTop: 6 }}>“</div>
            <div style={{ display: 'flex', flex: 1, fontSize: size, fontWeight: 800, color: '#FAFAFA', lineHeight: 1.12, letterSpacing: -2 }}>{title}</div>
          </div>
        </div>

        {/* Gambar artikel */}
        <div style={{ display: 'flex', flex: 1, position: 'relative', background: '#111111', overflow: 'hidden', borderTop: '6px solid #FF3E00' }}>
          {photo ? (
            <img src={photo} width={W} height={900} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', width: '100%', height: '100%', backgroundImage: 'linear-gradient(135deg, #1a1a1a, #2a1408)' }} />
          )}
          <div style={{ position: 'absolute', top: 32, left: 40, display: 'flex', background: '#FF3E00', color: '#000', fontSize: 26, fontWeight: 800, letterSpacing: 3, padding: '10px 18px' }}>{cat}</div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', height: 96, alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', background: '#050505', borderTop: '1px solid #262626' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#FAFAFA' }}>{domain}</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, fontWeight: 500, color: '#9CA3AF', letterSpacing: 3 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#22C55E', marginRight: 14 }} />
            BERITA VIRAL · TERKINI
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: fonts.length ? fonts : undefined,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
    },
  );
}
