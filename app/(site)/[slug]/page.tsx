import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdSlot from '@/components/AdSlot';
import { Header, MiniCard, PostCard } from '@/components/Site';
import { getLatest, getPost, getRelated } from '@/lib/db';
import { cleanHtml } from '@/lib/sanitize';
import { formatDate, readingTime, SITE_NAME, SITE_URL } from '@/lib/site';

// Cache 1 jam. Auto-post & admin akan refresh cache serta-merta bila ada perubahan.
export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Tidak dijumpai', robots: { index: false } };
  const desc = post.meta_description || post.excerpt || '';
  const image = post.image_url || post.image_thumb || undefined;
  return {
    title: post.title,
    description: desc,
    keywords: post.tags,
    alternates: { canonical: `/${post.slug}` },
    openGraph: {
      type: 'article', title: post.title, description: desc, url: `${SITE_URL}/${post.slug}`,
      images: image ? [{ url: image, width: 1200, height: 675 }] : undefined,
      publishedTime: post.published_at || undefined, modifiedTime: post.updated_at,
      section: post.categories?.name, tags: post.tags,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: desc, images: image ? [image] : undefined },
  };
}

export default async function ArticlePage({ params }: P) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [related, { posts: latest }] = await Promise.all([getRelated(post, 4), getLatest(1)]);
  const html = cleanHtml(post.content);
  // Selit iklan selepas perenggan ke-3
  const parts = html.split('</p>');
  const cut = Math.min(3, parts.length - 1);
  const top = parts.slice(0, cut).join('</p>') + (cut > 0 ? '</p>' : '');
  const bottom = parts.slice(cut).join('</p>');

  const url = `${SITE_URL}/${post.slug}`;
  const shareText = encodeURIComponent(`${post.title} ${url}`);
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'NewsArticle',
      headline: post.title.slice(0, 110), description: post.meta_description || post.excerpt,
      image: post.image_url ? [post.image_url] : undefined,
      datePublished: post.published_at, dateModified: post.updated_at,
      mainEntityOfPage: url, inLanguage: 'ms-MY', articleSection: post.categories?.name, keywords: post.tags?.join(', '),
      author: { '@type': 'Organization', name: `Editor ${SITE_NAME}`, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` } },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Utama', item: SITE_URL },
        ...(post.categories ? [{ '@type': 'ListItem', position: 2, name: post.categories.name, item: `${SITE_URL}/kategori/${post.categories.slug}` }] : []),
        { '@type': 'ListItem', position: post.categories ? 3 : 2, name: post.title, item: url },
      ],
    },
  ];

  return (
    <>
      <Header active={post.categories?.slug} />
      <main className="wrap">
        <div className="article-layout">
          <article>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Utama</Link>
              {post.categories && <> › <Link href={`/kategori/${post.categories.slug}`}>{post.categories.name}</Link></>}
            </nav>
            {post.categories && <span className="kicker">{post.categories.name}</span>}
            <h1>{post.title}</h1>
            {post.excerpt && <p className="lede">{post.excerpt}</p>}
            <div className="byline">
              <span>Oleh <strong>Editor {SITE_NAME}</strong></span>
              <time dateTime={post.published_at || undefined}>{formatDate(post.published_at)}</time>
              <span>{readingTime(html)} minit bacaan</span>
            </div>

            {post.image_url && (
              <figure className="feature">
                <img src={post.image_url} alt={post.title} width={1200} height={675} fetchPriority="high" decoding="async" />
                {post.image_credit && <figcaption>Gambar: {post.image_credit}</figcaption>}
              </figure>
            )}

            <div className="prose" dangerouslySetInnerHTML={{ __html: top }} />
            <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} />
            <div className="prose" dangerouslySetInnerHTML={{ __html: bottom }} />

            {post.tags?.length > 0 && (
              <div className="tags">{post.tags.map((t) => <Link key={t} href={`/cari?q=${encodeURIComponent(t)}`}>#{t}</Link>)}</div>
            )}

            <div className="share" aria-label="Kongsi">
              <a className="wa" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener">WhatsApp</a>
              <a className="fb" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener">Facebook</a>
              <a className="x" href={`https://x.com/intent/post?text=${shareText}`} target="_blank" rel="noopener">X</a>
              <a className="tg" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener">Telegram</a>
            </div>

            <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} />

            {related.length > 0 && (
              <>
                <div className="section-title"><h2>Baca juga</h2></div>
                <div className="grid">{related.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}</div>
              </>
            )}
          </article>

          <aside>
            <div className="sticky">
              <div className="side-head"><span>// Terkini</span><span className="pill" style={{ border: 0, padding: 0 }}><span className="dot" />Live</span></div>
              {latest.filter((p) => p.id !== post.id).slice(0, 6).map((p) => <MiniCard key={p.id} post={p} />)}
            </div>
          </aside>
        </div>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
