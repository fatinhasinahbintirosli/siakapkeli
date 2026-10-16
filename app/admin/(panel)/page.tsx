import Link from 'next/link';
import { runAutopostNow } from '../actions';
import { requireAdmin } from '@/lib/supabase-server';
import { timeAgo } from '@/lib/site';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { db } = await requireAdmin();
  const since = new Date(Date.now() - 86400000).toISOString();
  const [pub, draft, today, logs, enabled] = await Promise.all([
    db.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', since),
    db.from('autopost_logs').select('*').order('run_at', { ascending: false }).limit(25),
    db.from('settings').select('value').eq('key', 'autopost_enabled').maybeSingle(),
  ]);
  const errors24 = (logs.data || []).filter((l) => l.status === 'error' && l.run_at > since).length;

  return (
    <>
      <h1>
        Papan Utama
        <form action={runAutopostNow}><button className="btn pri">▶ Jalankan auto-post sekarang</button></form>
      </h1>
      {sp.ok === 'run' && <div className="notice">Auto-post sedang berjalan di GitHub. Semak log dalam 2–5 minit.</div>}
      {sp.err && <div className="notice err">{sp.err}</div>}
      {enabled.data?.value === false && <div className="notice err">Auto-post sedang DIMATIKAN. Hidupkan di <Link href="/admin/settings">Tetapan</Link>.</div>}

      <div className="stats">
        <div className="stat"><b>{pub.count ?? 0}</b><span>Artikel terbit</span></div>
        <div className="stat"><b>{today.count ?? 0}</b><span>Terbit 24 jam lepas</span></div>
        <div className="stat"><b>{draft.count ?? 0}</b><span>Draf</span></div>
        <div className="stat"><b style={{ color: errors24 ? '#b91c1c' : undefined }}>{errors24}</b><span>Ralat 24 jam lepas</span></div>
      </div>

      <div className="panel">
        <h2>Log auto-post terkini</h2>
        <table className="tbl">
          <thead><tr><th>Masa</th><th>Status</th><th className="hide-m">Sumber</th><th>Mesej</th></tr></thead>
          <tbody>
            {(logs.data || []).map((l) => (
              <tr key={l.id}>
                <td className="mut" style={{ whiteSpace: 'nowrap' }}>{timeAgo(l.run_at)}</td>
                <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                <td className="hide-m">{l.source_name}</td>
                <td style={{ wordBreak: 'break-word' }}>{l.post_id ? <Link href={`/admin/posts/${l.post_id}`}>{l.message}</Link> : l.message}</td>
              </tr>
            ))}
            {!logs.data?.length && <tr><td colSpan={4} className="mut">Belum ada log. Auto-post berjalan setiap 2 jam.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
