// ============================================================
// Auto-share ke Facebook melalui Postolab — dijalankan setiap jam (GitHub Actions)
//
// Setiap pusingan:
//  1. Ambil 1 artikel terbaru yang belum dikongsi (kad gambar /kad/<slug>)
//  2. Hantar ke SEMUA page (atau SHARE_PAGES_PER_RUN page jika ditetapkan)
//  3. Gemini tulis CAPTION BERLAINAN untuk setiap page
//  4. Setiap page dapat MINIT TERBIT BERBEZA, ditabur sepanjang jam
//     (susunan page dikocok setiap jam), link artikel dalam komen pertama
// ============================================================
import { createClient } from '@supabase/supabase-js';

const env = (k, d) => process.env[k] || d;
const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const SITE_URL = env('NEXT_PUBLIC_SITE_URL', '').replace(/\/$/, '');
const POSTOLAB_URL = env('POSTOLAB_URL', 'https://postolab.com').replace(/\/$/, '');
const POSTOLAB_API_KEY = (env('POSTOLAB_API_KEY', '')).trim();
const POSTOLAB_PAGE_IDS = env('POSTOLAB_PAGE_IDS', 'all').trim();
const GEMINI_KEY = env('GEMINI_API_KEY');
const GEMINI_MODEL = env('GEMINI_MODEL', 'gemini-3.8-flash');
const MAX_AGE_HOURS = Number(env('SHARE_MAX_AGE_HOURS', '24'));
const PAGES_PER_RUN = Math.max(0, Number(env('SHARE_PAGES_PER_RUN', '0')));   // 0 = semua page setiap jam
const SPREAD_MINUTES = Math.max(1, Number(env('SHARE_SPREAD_MINUTES', '55'))); // tempoh taburan masa terbit (minit)

for (const [k, v] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY, NEXT_PUBLIC_SITE_URL: SITE_URL, POSTOLAB_API_KEY })) {
  if (!v) { console.error(`Tiada env ${k}`); process.exit(1); }
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const log = async (status, message, post_id = null) => {
  console.log(`[${status}] ${message}`);
  await db.from('autopost_logs').insert({ status, message: String(message).slice(0, 1000), source_name: 'Facebook', post_id });
};
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- Postolab API ----------
async function postolab(method, body) {
  const res = await fetch(`${POSTOLAB_URL}/api/external/posts`, {
    method,
    // x-api-key juga dihantar kerana header Authorization dibuang oleh fetch jika berlaku redirect
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${POSTOLAB_API_KEY}`, 'x-api-key': POSTOLAB_API_KEY },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) {
    throw new Error(`${out.error || 'Postolab'} (HTTP ${res.status}${res.redirected ? `, redirect ke ${res.url}` : ''}${out.reason ? `, sebab: ${out.reason}` : ''})`);
  }
  return out;
}

// ---------- Pilih page: bergilir + rawak ----------
async function choosePages() {
  let all;
  if (POSTOLAB_PAGE_IDS === 'all') {
    const { pages } = await postolab('GET');
    all = (pages || []).map((p) => ({ id: String(p.page_id), name: p.page_name }));
  } else {
    all = POSTOLAB_PAGE_IDS.split(',').map((s) => s.trim()).filter(Boolean).map((id) => ({ id, name: id }));
  }
  if (!all.length) throw new Error('Tiada Facebook Page dijumpai dalam Postolab.');

  // Rekod bila setiap page terakhir dapat giliran (disimpan dalam jadual settings)
  const { data } = await db.from('settings').select('value').eq('key', 'share_rotation').maybeSingle();
  const lastUsed = (data?.value && typeof data.value === 'object') ? data.value : {};

  const n = PAGES_PER_RUN > 0 ? Math.min(PAGES_PER_RUN, all.length) : all.length;
  // Utamakan page paling lama tak dapat giliran; ambil kolam 2× saiz kumpulan, kocok, pilih n
  const byOldest = shuffle(all).sort((a, b) => (lastUsed[a.id] || '').localeCompare(lastUsed[b.id] || ''));
  const pool = byOldest.slice(0, Math.min(all.length, n * 2));
  return { chosen: shuffle(pool).slice(0, n), lastUsed, total: all.length };
}

async function saveRotation(lastUsed, pageIds) {
  const now = new Date().toISOString();
  const value = { ...lastUsed };
  for (const id of pageIds) value[id] = now;
  await db.from('settings').upsert({ key: 'share_rotation', value });
}

// ---------- Caption berlainan untuk setiap page ----------
const CTA = ['Baca artikel di komen 👇', 'Cerita penuh di ruangan komen 👇', 'Link artikel ada di komen ya 👇', 'Baca selanjutnya di komen 👇', 'Full story kat komen 👇'];
const COMMENTS = ['Baca penuh di sini 👉', 'Artikel penuh 👉', 'Cerita lengkap di sini 👉', 'Baca selanjutnya 👉', 'Klik untuk baca 👉'];

async function makeCaptions(post, n) {
  const fallback = () => shuffle(CTA).slice(0, n).map((cta, i) => `${i % 2 ? post.title : (post.excerpt || post.title)}\n\n${cta}`);
  if (!GEMINI_KEY) return fallback();
  const prompt = `Anda admin page Facebook berita viral Malaysia. Tulis ${n} caption Facebook yang SEMUANYA BERBEZA antara satu sama lain untuk artikel yang sama (setiap satu akan dipos di page berlainan).
Peraturan setiap caption:
- 1–2 ayat pendek, bahasa Melayu santai macam admin bercakap dengan follower.
- Setiap caption guna sudut/gaya berbeza: contohnya soalan kepada pembaca, reaksi emosi, fakta paling menarik, nada santai/kelakar (hanya jika cerita sesuai).
- Jangan ulang tajuk bulat-bulat. Jangan clickbait menipu. Tiada hashtag, tiada link.
- 1–3 emoji yang sesuai dengan nada cerita (jangan emoji ketawa untuk berita sedih, jenayah atau kematian).
- Baris terakhir ajak baca di komen dengan ayat yang berlainan setiap caption, dan akhiri dengan 👇
Balas JSON sahaja: {"captions": [string, ...]} dengan tepat ${n} item.

Tajuk: ${post.title}
Ringkasan: ${post.excerpt || ''}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 1, responseMimeType: 'application/json' } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return fallback();
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    let caps = (JSON.parse(raw.replace(/^```json\s*|```$/g, '').trim()).captions || [])
      .map((c) => String(c).trim()).filter((c) => c && c.length < 700);
    caps = [...new Set(caps)].map((c) => (/komen/i.test(c) ? c : `${c}\n\n${pick(CTA)}`));
    const fb = fallback();
    while (caps.length < n) caps.push(fb[caps.length % fb.length]);
    return caps.slice(0, n);
  } catch { return fallback(); }
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

    const { chosen, lastUsed, total } = await choosePages();
    const captions = await makeCaptions(post, chosen.length);

    // Setiap page dapat minit berbeza: slot sama rata sepanjang SPREAD_MINUTES + sedikit variasi rawak
    // dalam slotnya sendiri (jadi dua page tak akan jatuh pada minit yang sama). Susunan page sudah dikocok.
    const slot = (SPREAD_MINUTES * 60) / chosen.length;
    const offsets = chosen.map((_, i) => Math.floor(i * slot + Math.random() * Math.max(0, slot - 60)));
    const okPages = [], failed = [];
    for (const [i, page] of chosen.entries()) {
      const when = new Date(Date.now() + 60 * 1000 + offsets[i] * 1000).toISOString();
      const utm = `utm_source=facebook&utm_medium=social&utm_campaign=postolab&utm_content=${encodeURIComponent(page.id)}`;
      try {
        await postolab('POST', {
          pageIds: [page.id],
          message: captions[i],
          imageUrl: cardUrl,
          firstComment: `${pick(COMMENTS)} ${articleUrl}?${utm}`,
          scheduledAt: when,
        });
        okPages.push(page);
      } catch (e) {
        failed.push(`${page.name}: ${e.message}`);
      }
    }

    if (!okPages.length) throw new Error(failed.join(' | ') || 'Semua page gagal');
    await saveRotation(lastUsed, okPages.map((p) => p.id));
    await db.from('posts').update({ shared_at: new Date().toISOString(), share_error: failed.length ? failed.join(' | ').slice(0, 500) : null, fb_caption: captions[0] }).eq('id', post.id);
    await log('ok', `Dijadualkan ke ${okPages.length}/${total} page, minit berbeza sepanjang ${SPREAD_MINUTES} minit, caption berlainan: ${post.title}${failed.length ? ` — gagal: ${failed.join(' | ').slice(0, 300)}` : ''}`, post.id);
  } catch (e) {
    await db.from('posts').update({ share_error: e.message.slice(0, 500), share_attempts: (post.share_attempts || 0) + 1 }).eq('id', post.id);
    await log('error', `Gagal kongsi: ${e.message} — ${post.title}`, post.id);
    process.exitCode = 1;
  }
}

main().catch(async (e) => { console.error(e); await log('error', `Auto-share gagal: ${e.message}`); process.exit(1); });
