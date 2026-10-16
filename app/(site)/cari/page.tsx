import type { Metadata } from 'next';
import { Header, PostCard } from '@/components/Site';
import { searchPosts } from '@/lib/db';

export const metadata: Metadata = { title: 'Carian', robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const results = q ? await searchPosts(q.slice(0, 80)) : [];
  return (
    <>
      <Header />
      <main className="wrap">
        <div className="section-title"><h1>{q ? `Carian: "${q}"` : 'Carian'}</h1></div>
        {q && !results.length && <p className="empty">Tiada artikel dijumpai untuk "{q}".</p>}
        <div className="grid">{results.map((p) => <PostCard key={p.id} post={p} />)}</div>
      </main>
    </>
  );
}
