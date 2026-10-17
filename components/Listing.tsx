import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdSlot from '@/components/AdSlot';
import { Header, MiniCard, Pagination, PostCard } from '@/components/Site';
import { getLatest, type Category } from '@/lib/db';
import { PER_PAGE } from '@/lib/site';

// Dipakai oleh laman utama, halaman 2+, dan laman kategori
export default async function Listing({ page, category }: { page: number; category?: Category }) {
  if (!Number.isInteger(page) || page < 1) notFound();
  const { posts, total } = await getLatest(page, category?.id);
  if (page > 1 && !posts.length) notFound();

  const showHero = page === 1 && !category && posts.length >= 4;
  const [hero, ...rest] = posts;
  const side = showHero ? rest.slice(0, 3) : [];
  const grid = showHero ? rest.slice(3) : posts;
  const base = category ? `/kategori/${category.slug}` : '';

  return (
    <>
      <Header active={category?.slug} />
      <main className="wrap">
        {category && (
          <div className="page-head">
            <span className="kicker">// Kategori</span>
            <h1 style={{ marginTop: 14 }}>{category.name}{page > 1 ? ` — ${page}` : ''}</h1>
            <div className="bar" />
          </div>
        )}

        {showHero && (
          <section className="hero" aria-label="Berita utama">
            <Link href={`/${hero.slug}`} className="hero-main">
              {/* Saiz sederhana cukup untuk hero dan jauh lebih laju dimuat */}
              {(hero.image_thumb || hero.image_url) && (
                <img src={hero.image_thumb || hero.image_url!} alt={hero.title} width={1200} height={675}
                  fetchPriority="high" decoding="async" />
              )}
              <div className="hero-text">
                {hero.categories && <span className="kicker">{hero.categories.name}</span>}
                <h2>{hero.title}</h2>
                {hero.excerpt && <p>{hero.excerpt}</p>}
              </div>
            </Link>
            <div className="hero-side">{side.map((p) => <MiniCard key={p.id} post={p} />)}</div>
          </section>
        )}
        {showHero && <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST} />}

        <div className="section-title">
          {!category && page > 1 ? <h1>Terkini — halaman {page}</h1> : <h2>{category ? 'Artikel' : 'Terkini'}</h2>}
        </div>
        {!posts.length && <p className="empty">// belum ada artikel — auto-post akan isi tak lama lagi_</p>}
        {/* Kad dalam kumpulan 6 (2 baris), dengan iklan di antara setiap kumpulan */}
        {Array.from({ length: Math.ceil(grid.length / 6) }, (_, g) => (
          <div key={g}>
            {g > 0 && <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST} />}
            <div className="grid">
              {grid.slice(g * 6, g * 6 + 6).map((p, i) => <PostCard key={p.id} post={p} priority={!showHero && g === 0 && i < 3} />)}
            </div>
          </div>
        ))}
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX} variant="multiplex" />
        <Pagination page={page} total={total} perPage={PER_PAGE} base={base} />
      </main>
    </>
  );
}
