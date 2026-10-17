import { saveSettings } from '../../actions';
import { requireAdmin } from '@/lib/supabase-server';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const sp = await searchParams;
  const { db } = await requireAdmin();
  const { data } = await db.from('settings').select('key, value');
  const get = (k: string, d: any) => data?.find((r) => r.key === k)?.value ?? d;

  const envOk = (k: string) => (process.env[k] ? '✅' : '❌');
  return (
    <>
      <h1>Tetapan</h1>
      {sp.ok && <div className="notice">Tetapan disimpan.</div>}
      <form action={saveSettings} className="panel">
        <h2>Auto-post</h2>
        <label className="row" style={{ fontWeight: 600, marginBottom: 14 }}>
          <input type="checkbox" name="autopost_enabled" defaultChecked={get('autopost_enabled', true) !== false} />
          Hidupkan auto-post (setiap 2 jam)
        </label>
        <label className="row" style={{ fontWeight: 600, marginBottom: 14 }}>
          <input type="checkbox" name="share_enabled" defaultChecked={get('share_enabled', true) !== false} />
          Auto-share ke Facebook melalui Postolab (setiap jam, 1 artikel)
        </label>
        <div className="field">
          <label htmlFor="ai">Arahan tambahan untuk AI</label>
          <textarea id="ai" name="ai_extra_instructions" rows={5} defaultValue={get('ai_extra_instructions', '')}
            placeholder="cth: Guna gaya loghat utara sikit. Selalu akhiri dengan soalan kepada pembaca. Elak topik politik." />
          <small>Arahan ini ditambah ke setiap permintaan Gemini semasa menulis artikel.</small>
        </div>
        <button className="btn pri">Simpan tetapan</button>
      </form>

      <div className="panel">
        <h2>Status sambungan (Vercel env)</h2>
        <table className="tbl">
          <tbody>
            <tr><td>Supabase</td><td>{envOk('NEXT_PUBLIC_SUPABASE_URL')}</td></tr>
            <tr><td>imgbb (upload dari admin)</td><td>{envOk('IMGBB_API_KEY')}</td></tr>
            <tr><td>AdSense client</td><td>{envOk('NEXT_PUBLIC_ADSENSE_CLIENT')} <span className="mut">{process.env.NEXT_PUBLIC_ADSENSE_CLIENT}</span></td></tr>
            <tr><td>Revalidate secret</td><td>{envOk('REVALIDATE_SECRET')}</td></tr>
            <tr><td>Butang "Jalankan sekarang" (GitHub)</td><td>{envOk('GITHUB_TOKEN')} {process.env.GITHUB_REPO}</td></tr>
          </tbody>
        </table>
        <p className="mut" style={{ marginBottom: 0 }}>Kunci Gemini dan imgbb untuk auto-post disimpan di GitHub &gt; Settings &gt; Secrets, bukan di sini.</p>
      </div>
    </>
  );
}
