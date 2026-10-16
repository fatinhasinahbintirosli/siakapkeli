import { deleteSource, saveSource } from '../../actions';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { requireAdmin } from '@/lib/supabase-server';
import { timeAgo } from '@/lib/site';

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { db } = await requireAdmin();
  const [{ data: sources }, { data: cats }] = await Promise.all([
    db.from('sources').select('*').order('created_at'),
    db.from('categories').select('id, name').order('name'),
  ]);
  const CatSelect = ({ value }: { value?: string | null }) => (
    <select name="category_id" defaultValue={value || ''} aria-label="Kategori asal">
      <option value="">AI pilih</option>
      {(cats || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );

  return (
    <>
      <h1>Sumber auto-post</h1>
      {sp.ok && <div className="notice">Disimpan.</div>}
      {sp.err && <div className="notice err">{sp.err}</div>}
      <p className="mut">Sistem semak RSS setiap sumber aktif setiap 2 jam dan terbitkan artikel baru sehingga had setiap pusingan. Kategori "AI pilih" bermaksud Gemini tentukan kategori ikut isi cerita.</p>

      <div className="panel">
        <h2>Tambah sumber</h2>
        <form action={saveSource} className="row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ flex: '1 1 160px', margin: 0 }}><label>Nama</label><input type="text" name="name" placeholder="cth: Harian Metro" required /></div>
          <div className="field" style={{ flex: '3 1 280px', margin: 0 }}><label>URL RSS / feed</label><input type="url" name="feed_url" placeholder="https://contoh.com/feed" required /></div>
          <div className="field" style={{ flex: '1 1 140px', margin: 0 }}><label>Kategori</label><CatSelect /></div>
          <div className="field" style={{ width: 90, margin: 0 }}><label>Had/pusingan</label><input type="number" name="max_per_run" defaultValue={2} min={1} max={10} /></div>
          <input type="hidden" name="active" value="on" />
          <button className="btn pri">Tambah</button>
        </form>
        <p className="mut" style={{ marginBottom: 0 }}>Tip: kebanyakan laman WordPress ada feed di <code>/feed</code>. Cuba buka URL itu dalam pelayar; kalau keluar kod XML, ia betul.</p>
      </div>

      {(sources || []).map((s) => (
        <div className="panel" key={s.id}>
          <form action={saveSource} className="row" style={{ alignItems: 'end' }}>
            <input type="hidden" name="id" value={s.id} />
            <div className="field" style={{ flex: '1 1 160px', margin: 0 }}><label>Nama</label><input type="text" name="name" defaultValue={s.name} /></div>
            <div className="field" style={{ flex: '3 1 280px', margin: 0 }}><label>URL RSS</label><input type="url" name="feed_url" defaultValue={s.feed_url} /></div>
            <div className="field" style={{ flex: '1 1 140px', margin: 0 }}><label>Kategori</label><CatSelect value={s.category_id} /></div>
            <div className="field" style={{ width: 90, margin: 0 }}><label>Had</label><input type="number" name="max_per_run" defaultValue={s.max_per_run} min={1} max={10} /></div>
            <label className="row" style={{ gap: 6, fontWeight: 600 }}><input type="checkbox" name="active" defaultChecked={s.active} /> Aktif</label>
            <button className="btn">Simpan</button>
          </form>
          <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
            <span className="mut" style={{ fontSize: 13 }}>Kali terakhir dijalankan: {s.last_run_at ? timeAgo(s.last_run_at) : 'belum'}</span>
            <form action={deleteSource}><input type="hidden" name="id" value={s.id} /><ConfirmButton message={`Padam sumber ${s.name}?`}>Padam</ConfirmButton></form>
          </div>
        </div>
      ))}
    </>
  );
}
