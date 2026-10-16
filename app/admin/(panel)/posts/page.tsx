import Link from 'next/link';
import { deletePost, togglePost } from '../../actions';
import { requireAdmin } from '@/lib/supabase-server';
import { timeAgo } from '@/lib/site';
import ConfirmButton from '@/components/admin/ConfirmButton';

const PER = 30;

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ s?: string; q?: string; p?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { db } = await requireAdmin();
  const page = Math.max(1, Number(sp.p || 1));
  let q = db.from('posts').select('id, title, slug, status, auto, image_thumb, published_at, created_at, source_name, categories(name)', { count: 'exact' })
    .order('created_at', { ascending: false }).range((page - 1) * PER, page * PER - 1);
  if (sp.s === 'published' || sp.s === 'draft') q = q.eq('status', sp.s);
  if (sp.s === 'auto') q = q.eq('auto', true);
  if (sp.q) q = q.ilike('title', `%${sp.q.replace(/[%,]/g, '')}%`);
  const { data: posts, count } = await q;
  const qs = (o: Record<string, string | undefined>) => '?' + new URLSearchParams(Object.entries({ s: sp.s, q: sp.q, ...o }).filter(([, v]) => v) as any).toString();
  const pages = Math.ceil((count || 0) / PER);

  return (
    <>
      <h1>Artikel <Link href="/admin/posts/new" className="btn pri">+ Tulis baru</Link></h1>
      {sp.ok === 'deleted' && <div className="notice">Artikel dipadam.</div>}
      <div className="filters">
        {[['', 'Semua'], ['published', 'Terbit'], ['draft', 'Draf'], ['auto', 'Auto-post']].map(([v, l]) => (
          <Link key={v} href={qs({ s: v || undefined, p: undefined })} className={(sp.s || '') === v ? 'on' : ''}>{l}</Link>
        ))}
        <form style={{ marginLeft: 'auto' }}>
          {sp.s && <input type="hidden" name="s" value={sp.s} />}
          <input type="search" name="q" defaultValue={sp.q} placeholder="Cari tajuk…" />
        </form>
      </div>
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th className="hide-m"></th><th>Tajuk</th><th>Status</th><th className="hide-m">Kategori</th><th className="hide-m">Tarikh</th><th></th></tr></thead>
          <tbody>
            {(posts || []).map((p: any) => (
              <tr key={p.id}>
                <td className="hide-m">{p.image_thumb ? <img src={p.image_thumb} alt="" /> : null}</td>
                <td className="title">
                  <Link href={`/admin/posts/${p.id}`}>{p.title}</Link>
                  <div className="mut" style={{ fontSize: 12 }}>{p.auto && <span className="badge auto">AUTO</span>} {p.source_name}</div>
                </td>
                <td><span className={`badge ${p.status}`}>{p.status === 'published' ? 'Terbit' : 'Draf'}</span></td>
                <td className="hide-m">{p.categories?.name || '—'}</td>
                <td className="hide-m mut" style={{ whiteSpace: 'nowrap' }}>{timeAgo(p.published_at || p.created_at)}</td>
                <td>
                  <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                    {p.status === 'published' && <a className="btn sm" href={`/${p.slug}`} target="_blank">Lihat</a>}
                    <form action={togglePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="to" value={p.status === 'published' ? 'draft' : 'published'} />
                      <button className="btn sm">{p.status === 'published' ? 'Nyahterbit' : 'Terbit'}</button>
                    </form>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton message={`Padam "${p.title}"? Tindakan ini tidak boleh diundur.`}>✕</ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!posts?.length && <tr><td colSpan={6} className="mut" style={{ padding: 20 }}>Tiada artikel.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="row" style={{ justifyContent: 'center' }}>
          {page > 1 && <Link className="btn sm" href={qs({ p: String(page - 1) })}>← Sebelum</Link>}
          <span className="mut">{page} / {pages}</span>
          {page < pages && <Link className="btn sm" href={qs({ p: String(page + 1) })}>Seterusnya →</Link>}
        </div>
      )}
    </>
  );
}
