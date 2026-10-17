import Link from 'next/link';
import { getCategories, type Post } from '@/lib/db';
import { SITE_DESC, SITE_NAME, timeAgo } from '@/lib/site';

function Brand() {
  const [a, ...rest] = SITE_NAME.split(' ');
  return (
    <>
      <span className="dia" aria-hidden="true" />
      <span>{a}{rest.length ? <> <b>{rest.join(' ')}</b></> : null}</span>
    </>
  );
}

export async function Header({ active }: { active?: string }) {
  const cats = await getCategories();
  return (
    <>
      <header className="topnav">
        <div className="wrap">
          <Link href="/" className="brand" aria-label={`${SITE_NAME} — laman utama`}><Brand /></Link>
          <span className="pill"><span className="dot" />Live · Auto-update</span>
          <form className="search" action="/cari" role="search">
            <label htmlFor="q" className="sr-only">Cari artikel</label>
            <input id="q" name="q" type="search" placeholder="cari berita_" />
          </form>
        </div>
      </header>
      <nav className="catbar" aria-label="Kategori">
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
        <div className="cols">
          <div>
            <Link href="/" className="brand"><Brand /></Link>
            <p className="tagline">{SITE_DESC}</p>
          </div>
          <div>
            <h5>// Laman</h5>
            <ul>
              <li><Link href="/tentang-kami">Tentang Kami</Link></li>
              <li><Link href="/hubungi-kami">Hubungi Kami</Link></li>
              <li><a href="/rss.xml">RSS Feed</a></li>
            </ul>
          </div>
          <div>
            <h5>// Polisi</h5>
            <ul>
              <li><Link href="/dasar-privasi">Dasar Privasi</Link></li>
              <li><Link href="/terma">Terma Penggunaan</Link></li>
            </ul>
          </div>
        </div>
        <div className="bottom">
          <span>© {new Date().getFullYear()} {SITE_NAME}. Hak cipta terpelihara.</span>
          <span className="pill" style={{ border: 0, padding: 0 }}><span className="dot" />All systems normal</span>
        </div>
      </div>
    </footer>
  );
}

// Saiz sederhana imgbb (~640px) untuk kad — jauh lebih ringan daripada gambar penuh
const img = (p: Post) => p.image_thumb || p.image_url;

export function PostCard({ post, priority }: { post: Post; priority?: boolean }) {
  return (
    <Link href={`/${post.slug}`} className="card">
      <div className="thumb">
        {img(post) && (
          <img src={img(post)!} alt={post.title} width={640} height={360} decoding="async"
            loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} />
        )}
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
      <div className="thumb">{img(post) && <img src={img(post)!} alt="" width={208} height={156} loading="lazy" decoding="async" />}</div>
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
      <span>{String(page).padStart(2, '0')} / {String(pages).padStart(2, '0')}</span>
      {page < pages && <Link href={href(page + 1)} rel="next">Seterusnya →</Link>}
    </nav>
  );
}
