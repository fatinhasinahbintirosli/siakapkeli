// ============================================================
// Auto-share ke Facebook melalui Postolab — dijalankan setiap jam (GitHub Actions)
// Ambil 1 artikel terbaru yang belum dikongsi → kad gambar /kad/<slug> →
// caption ringkas (Gemini) → hantar ke Postolab (link artikel dalam komen pertama)
// ============================================================
import { createClient } from '@supabase/supabase-js';

const env = (k, d) => process.env[k] || d;
const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const SITE_URL = env('NEXT_PUBLIC_SITE_URL', '').replace(/\/$/, '');
const POSTOLAB_URL = env('POSTOLAB_URL', 'https://postolab.com').replace(/\/$/, '');
const POSTOLAB_API_KEY = env('POSTOLAB_API_KEY');
const POSTOLAB_PAGE_IDS = env('POSTOLAB_PAGE_IDS', 'all');
const GEMINI_KEY = env('GEMINI_API_KEY');
const GEMINI_MODEL = env('GEMINI_MODEL', 'gemini-3.8-flash');
const MAX_AGE_HOURS = Number(env('SHARE_MAX_AGE_HOURS', '24'));

for (const [k, v] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY, NEXT_PUBLIC_SITE_URL: SITE_URL, POSTOLAB_API_KEY })) {
  if (!v) { console.error(`Tiada env ${k}`); process.exit(1); }
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const log = async (status, message, post_id = null) => {
  console.log(`[${status}] ${message}`);
  await db.from('autopost_logs').insert({ status, message: String(message).slice(0, 1000), source_name: 'Facebook', post_id });
};

async function makeCaption(post) {
  const fallback = `${post.excerpt || post.title}\n\nBaca artikel penuh di komen 👇`;
  if (!GEMINI_KEY) return fallback;
  const prompt = `Tulis caption Facebook untuk page berita viral Malaysia berdasarkan artikel ini.
Peraturan: 1–2 ayat pendek sahaja, bahasa Melayu santai macam admin page bercakap dengan follower, 1–3 emoji yang sesuai dengan nada cerita (jangan emoji ketawa untuk berita sedih/kematian), jangan ulang tajuk bulat-bulat, jangan clickbait menipu, tiada hashtag, tiada link.
Baris terakhir MESTI: "Baca artikel di komen 👇"
Balas JSON sahaja: {"caption": string}

Tajuk: ${post.title}
Ringkasan: ${post.excerpt || ''}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, responseMimeType: 'application/json' } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const caption = JSON.parse(raw.replace(/^```json\s*|```$/g, '').trim()).caption;
    return caption && caption.length < 600 ? caption : fallback;
  } catch { return fallback; }
}

async function main() {
  const { data: setting } = await db.from('settings').select('value').eq('key', 'share_enabled').maybeSingle();
  if (setting && setting.value === false) { console.log('Auto-share dimatikan di admin.'); return; }

  const since = new Date(Date.now() - MAX_AGE_HOURS * 3600 * 1000).toISOString();
  const { data: posts, error } = await db.from('posts')
    .select('id, title, slug, excerpt, image_url, share_attempts')
    .eq('status', 'published').is('shared_at', null).not('image_url', 'is', null)
    .lt('share_attempts', 3).gte('published_at', since)
    .order('published_at', { ascending: false }).limit(1);
  if (error) throw new Error(error.message);
  const post = posts?.[0];
  if (!post) { console.log('Tiada artikel baru untuk dikongsi.'); return; }

  const articleUrl = `${SITE_URL}/${post.slug}`;
  const cardUrl = `${SITE_URL}/kad/${post.slug}`;
  try {
    // Pastikan kad gambar berjaya dijana (juga memanaskan cache sebelum Facebook mengambilnya)
    const card = await fetch(cardUrl, { signal: AbortSignal.timeout(60000) });
    if (!card.ok || !(card.headers.get('content-type') || '').includes('image')) throw new Error(`Kad gambar gagal (HTTP ${card.status})`);

    const caption = await makeCaption(post);
    const pageIds = POSTOLAB_PAGE_IDS.trim() === 'all' ? 'all' : POSTOLAB_PAGE_IDS.split(',').map((s) => s.trim()).filter(Boolean);
    const firstComment = `Baca penuh di sini 👉 ${articleUrl}?utm_source=facebook&utm_medium=social&utm_campaign=postolab`;

    const res = await fetch(`${POSTOLAB_URL}/api/external/posts`, {
      method: 'POST',
      // x-api-key juga dihantar kerana header Authorization dibuang oleh fetch jika berlaku redirect (cth. postolab.com → www.postolab.com)
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${POSTOLAB_API_KEY.trim()}`, 'x-api-key': POSTOLAB_API_KEY.trim() },
      body: JSON.stringify({ pageIds, message: caption, imageUrl: cardUrl, firstComment }),
      signal: AbortSignal.timeout(30000),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.success) throw new Error(`${out.error || 'Postolab'} (HTTP ${res.status}${res.redirected ? `, redirect ke ${res.url}` : ''}${out.reason ? `, sebab: ${out.reason}` : ''})`);

    await db.from('posts').update({ shared_at: new Date().toISOString(), share_error: null, fb_caption: caption }).eq('id', post.id);
    await log('ok', `Dihantar ke Postolab (${out.pages} page): ${post.title}`, post.id);
  } catch (e) {
    await db.from('posts').update({ share_error: e.message.slice(0, 500), share_attempts: (post.share_attempts || 0) + 1 }).eq('id', post.id);
    await log('error', `Gagal kongsi: ${e.message} — ${post.title}`, post.id);
    process.exitCode = 1;
  }
}

main().catch(async (e) => { console.error(e); await log('error', `Auto-share gagal: ${e.message}`); process.exit(1); });
