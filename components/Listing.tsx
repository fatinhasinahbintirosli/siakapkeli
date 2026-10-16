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
  const heading = category ? category.name : page === 1 ? 'Terkini' : `Terkini — halaman ${page}`;
  const base = category ? `/kategori/${category.slug}` : '';

  return (
    <>
      <Header active={category?.slug} />
      <main className="wrap">
        {showHero && (
          <section className="hero" aria-label="Berita utama">
            <a href={`/${hero.slug}`} className="hero-main">
              {(hero.image_url || hero.image_thumb) && (
                <img src={hero.image_url || hero.image_thumb!} alt={hero.title} width={1200} height={675} fetchPriority="high" />
              )}
              <div className="hero-text">
                {hero.categories && <span className="kicker">{hero.categories.name}</span>}
                <h2>{hero.title}</h2>
                {hero.excerpt && <p style={{ margin: 0, opacity: 0.9 }}>{hero.excerpt}</p>}
              </div>
            </a>
            <div className="hero-side">{side.map((p) => <MiniCard key={p.id} post={p} />)}</div>
          </section>
        )}

        <div className="section-title">{category || page > 1 ? <h1>{heading}</h1> : <h2>{heading}</h2>}</div>
        {!posts.length && <p className="empty">Belum ada artikel. Auto-post akan isi tak lama lagi.</p>}
        <div className="grid">
          {grid.slice(0, 6).map((p, i) => <PostCard key={p.id} post={p} priority={!showHero && i < 3} />)}
        </div>
        {grid.length > 6 && <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST} />}
        <div className="grid">
          {grid.slice(6).map((p) => <PostCard key={p.id} post={p} />)}
        </div>
        <Pagination page={page} total={total} perPage={PER_PAGE} base={base} />
      </main>
    </>
  );
}
