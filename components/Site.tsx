import Link from 'next/link';
import { getCategories, type Post } from '@/lib/db';
import { SITE_NAME, timeAgo } from '@/lib/site';

export async function Header({ active }: { active?: string }) {
  const cats = await getCategories();
  const [a, ...rest] = SITE_NAME.split(' ');
  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <Link href="/" className="logo" aria-label={`${SITE_NAME} — laman utama`}>
            {a}<span>{rest.length ? ` ${rest.join(' ')}` : ''}</span>
          </Link>
          <form className="search" action="/cari" role="search">
            <label htmlFor="q" className="sr-only">Cari artikel</label>
            <input id="q" name="q" type="search" placeholder="Cari berita…" />
          </form>
        </div>
      </header>
      <nav className="navbar" aria-label="Kategori">
        <div className="wrap">
          <ul>
            <li><Link href="/" aria-current={!active ? 'page' : undefined}>Terkini</Link></li>
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={`/kategori/${c.slug}`} aria-current={active === c.slug ? 'page' : undefined}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div>© {new Date().getFullYear()} {SITE_NAME}. Hak cipta terpelihara.</div>
        <nav aria-label="Pautan laman">
          <Link href="/tentang-kami">Tentang Kami</Link>
          <Link href="/hubungi-kami">Hubungi Kami</Link>
          <Link href="/dasar-privasi">Dasar Privasi</Link>
          <Link href="/terma">Terma Penggunaan</Link>
          <a href="/rss.xml">RSS</a>
        </nav>
      </div>
    </footer>
  );
}

const img = (p: Post) => p.image_thumb || p.image_url;

export function PostCard({ post, priority }: { post: Post; priority?: boolean }) {
  return (
    <Link href={`/${post.slug}`} className="card">
      <div className="thumb">
        {img(post) && <img src={img(post)!} alt={post.title} width={640} height={360} loading={priority ? 'eager' : 'lazy'} />}
      </div>
      <div className="body">
        {post.categories && <span className="kicker">{post.categories.name}</span>}
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <span className="meta">{timeAgo(post.published_at)}</span>
      </div>
    </Link>
  );
}

export function MiniCard({ post }: { post: Post }) {
  return (
    <Link href={`/${post.slug}`} className="mini">
      <div className="thumb">{img(post) && <img src={img(post)!} alt="" width={220} height={165} loading="lazy" />}</div>
      <div>
        {post.categories && <span className="kicker">{post.categories.name}</span>}
        <h3>{post.title}</h3>
        <span className="meta">{timeAgo(post.published_at)}</span>
      </div>
    </Link>
  );
}

export function Pagination({ page, total, perPage, base }: { page: number; total: number; perPage: number; base: string }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  const href = (n: number) => (n === 1 ? base || '/' : `${base}/halaman/${n}`);
  return (
    <nav className="pagination" aria-label="Halaman">
      {page > 1 && <Link href={href(page - 1)} rel="prev">← Sebelum</Link>}
      <span>{page} / {pages}</span>
      {page < pages && <Link href={href(page + 1)} rel="next">Seterusnya →</Link>}
    </nav>
  );
}
