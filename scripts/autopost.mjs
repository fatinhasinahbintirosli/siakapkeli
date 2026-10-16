// ============================================================
// Enjin auto-post Siakap Keli
// RSS sumber → baca artikel → Gemini tulis semula → imgbb → terbit
// Dijalankan oleh GitHub Actions setiap 2 jam (lihat .github/workflows)
// ============================================================
import Parser from 'rss-parser';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { createClient } from '@supabase/supabase-js';

const env = (k, d) => process.env[k] ?? d;
const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_KEY = env('GEMINI_API_KEY');
const GEMINI_MODEL = env('GEMINI_MODEL') || 'gemini-3.8-flash';
const IMGBB_KEY = env('IMGBB_API_KEY');
const SITE_URL = env('NEXT_PUBLIC_SITE_URL', '').replace(/\/$/, '');
const REVALIDATE_SECRET = env('REVALIDATE_SECRET');
const DELAY_MS = Number(env('AUTOPOST_DELAY_MS', '8000')); // jarak antara panggilan AI

for (const [k, v] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY, GEMINI_API_KEY: GEMINI_KEY, IMGBB_API_KEY: IMGBB_KEY })) {
  if (!v) { console.error(`Tiada env ${k}`); process.exit(1); }
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const parser = new Parser({ timeout: 20000, headers: { 'User-Agent': UA } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function log(status, message, source_name = null, post_id = null) {
  console.log(`[${status}] ${source_name ?? ''} ${message}`);
  await db.from('autopost_logs').insert({ status, message: String(message).slice(0, 1000), source_name, post_id });
}

async function getSetting(key, fallback) {
  const { data } = await db.from('settings').select('value').eq('key', key).maybeSingle();
  return data ? data.value : fallback;
}

export function slugify(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80).replace(/-$/, '');
}

async function uniqueSlug(base) {
  let slug = base || `artikel-${Date.now()}`;
  for (let i = 2; i < 50; i++) {
    const { data } = await db.from('posts').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function fetchArticle(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ms-MY,ms;q=0.9,en;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const vc = new VirtualConsole(); // senyapkan ralat CSS jsdom
  const dom = new JSDOM(html, { url, virtualConsole: vc });
  const doc = dom.window.document;
  const meta = (sel) => doc.querySelector(sel)?.getAttribute('content') || null;
  const image = meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]') || meta('meta[property="og:image:url"]');
  const ogTitle = meta('meta[property="og:title"]');

  // 1) Data berstruktur JSON-LD (articleBody) — banyak portal berita letak teks penuh di sini
  let ldBody = '';
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const walk = (o) => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (typeof o.articleBody === 'string' && o.articleBody.length > ldBody.length) ldBody = o.articleBody;
        if (o['@graph']) walk(o['@graph']);
      };
      walk(JSON.parse(s.textContent));
    } catch {}
  }

  // 2) Readability (teks utama halaman)
  const article = new Readability(doc).parse();
  const rdText = article?.textContent || '';

  const text = clean(ldBody.length > rdText.length ? ldBody : rdText);
  return { title: article?.title || ogTitle || '', text, image };
}

const clean = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

async function rewriteWithGemini({ title, text, sourceName, categories, extra }) {
  const prompt = `Anda penulis blog berita viral Malaysia yang berpengalaman. Tulis SATU artikel BARU dalam Bahasa Melayu berdasarkan FAKTA daripada bahan sumber di bawah.

PERATURAN PENULISAN:
- Tulis dengan ayat dan susunan anda sendiri. JANGAN salin atau terjemah ayat demi ayat daripada sumber.
- Gaya santai tapi kemas, macam manusia bercerita kepada kawan. Variasikan panjang ayat. Boleh guna sedikit bahasa pasar yang sopan.
- Elakkan klise AI seperti "Kesimpulannya", "Dalam era digital ini", "Tidak dapat dinafikan", "Secara keseluruhannya".
- Jangan reka fakta, nama, angka atau petikan yang tiada dalam sumber. Kalau ada petikan, ringkaskan dengan kata-kata sendiri.
- Tambah nilai: jelaskan latar belakang ringkas, kenapa ia jadi perhatian, atau apa yang pembaca patut tahu.
- 400 hingga 700 patah perkataan. Perenggan pendek (2–4 ayat).
- Format kandungan dalam HTML ringkas: hanya <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>. Tiada <h1>, tiada gambar, tiada pautan.
- Tajuk menarik dan jujur (bukan clickbait menipu), maksimum 90 aksara.
- Jangan sebut "sumber", "menurut laporan" berulang kali; kredit sumber akan ditambah oleh sistem.
${extra ? `- Arahan tambahan pemilik blog: ${extra}\n` : ''}
Pilih SATU kategori paling sesuai daripada senarai ini: ${categories.join(', ')}.

Balas dalam JSON sahaja dengan kunci:
{"title": string, "excerpt": string (1-2 ayat, maks 200 aksara), "meta_description": string (maks 155 aksara, ada kata kunci utama), "content_html": string, "category": string, "tags": string[] (3-6 tag pendek huruf kecil)}

BAHAN SUMBER (${sourceName}):
Tajuk asal: ${title}
${text.slice(0, 12000)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(90000),
    });
    if (res.status === 429 || res.status >= 500) { await sleep(20000 * attempt); continue; }
    if (!res.ok) {
      const err = new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
      err.fatal = true; // kunci/model salah — tiada guna cuba artikel lain
      throw err;
    }
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const json = JSON.parse(raw.replace(/^```json\s*|```$/g, '').trim());
    if (!json.title || !json.content_html) throw new Error('Jawapan Gemini tidak lengkap');
    return json;
  }
  throw new Error('Gemini gagal selepas 3 cubaan (had kuota?)');
}

async function uploadToImgbb(imageUrl, name) {
  const tryUpload = async (image) => {
    const form = new FormData();
    form.append('key', IMGBB_KEY);
    form.append('image', image);
    form.append('name', name.slice(0, 60));
    const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form, signal: AbortSignal.timeout(60000) });
    const j = await res.json();
    if (!j.success) throw new Error(j?.error?.message || 'imgbb gagal');
    return { url: j.data.image?.url || j.data.url, thumb: j.data.medium?.url || j.data.thumb?.url || j.data.url };
  };
  try {
    return await tryUpload(imageUrl); // imgbb boleh terima URL terus
  } catch {
    // sesetengah laman sekat imgbb; muat turun dulu dan hantar base64
    const r = await fetch(imageUrl, { headers: { 'User-Agent': UA, Referer: new URL(imageUrl).origin }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`Gambar HTTP ${r.status}`);
    const b64 = Buffer.from(await r.arrayBuffer()).toString('base64');
    return await tryUpload(b64);
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function processItem(item, source, categories, extra) {
  const link = item.link?.trim();
  if (!link) return 'skip';
  const { data: exists } = await db.from('posts').select('id').eq('source_url', link).maybeSingle();
  if (exists) return 'seen';

  const art = await fetchArticle(link);
  // Pilih teks terpanjang: halaman artikel atau kandungan yang disediakan dalam RSS
  const feedText = clean(item['content:encoded'] || item.content || item.contentSnippet || '');
  const text = art.text.length >= feedText.length ? art.text : feedText;
  if (text.length < 400) return 'short';

  const ai = await rewriteWithGemini({
    title: art.title || item.title || '', text, sourceName: source.name,
    categories: categories.map((c) => c.name), extra,
  });

  let image = null;
  const imgSrc = art.image || item.enclosure?.url;
  if (imgSrc) {
    try { image = await uploadToImgbb(new URL(imgSrc, link).href, slugify(ai.title)); }
    catch (e) { await log('error', `Gambar gagal (${e.message}) — terbit tanpa gambar`, source.name); }
  }

  const cat = categories.find((c) => c.name.toLowerCase() === String(ai.category || '').toLowerCase());
  const slug = await uniqueSlug(slugify(ai.title));
  const credit = `<p class="sumber">Sumber: <a href="${esc(link)}" target="_blank" rel="nofollow noopener">${esc(source.name)}</a></p>`;

  const { data: post, error } = await db.from('posts').insert({
    title: ai.title.slice(0, 200),
    slug,
    excerpt: ai.excerpt?.slice(0, 300) || null,
    meta_description: ai.meta_description?.slice(0, 160) || null,
    content: `${ai.content_html}\n${credit}`,
    image_url: image?.url || null,
    image_thumb: image?.thumb || null,
    image_credit: image ? source.name : null,
    source_url: link,
    source_name: source.name,
    category_id: cat?.id || source.category_id || null,
    tags: Array.isArray(ai.tags) ? ai.tags.slice(0, 6).map((t) => String(t).toLowerCase()) : [],
    status: 'published',
    auto: true,
    published_at: new Date().toISOString(),
  }).select('id, slug').single();
  if (error) throw new Error(error.message);
  await log('ok', `Terbit: /${post.slug}`, source.name, post.id);
  return 'ok';
}

async function main() {
  const enabled = await getSetting('autopost_enabled', true);
  if (enabled === false) { console.log('Auto-post dimatikan di admin.'); return; }
  const extra = await getSetting('ai_extra_instructions', '');

  const { data: categories } = await db.from('categories').select('id, name, slug');
  const { data: sources } = await db.from('sources').select('*').eq('active', true);
  if (!sources?.length) { console.log('Tiada sumber aktif.'); return; }

  let published = 0;
  for (const source of sources) {
    let feed;
    try { feed = await parser.parseURL(source.feed_url); }
    catch (e) { await log('error', `RSS gagal: ${e.message}`, source.name); continue; }

    let done = 0, short = 0;
    for (const item of feed.items.slice(0, 15)) {
      if (done >= source.max_per_run) break;
      try {
        const r = await processItem(item, source, categories || [], extra);
        if (r === 'ok') { done++; published++; await sleep(DELAY_MS); }
        if (r === 'short') short++;
      } catch (e) {
        if (e.fatal) { await log('error', `Berhenti: ${e.message}`, source.name); throw e; }
        // Laman menolak akses automatik (403/401/429): hormati & berhenti untuk sumber ini
        if (/HTTP (401|403|429)/.test(e.message)) {
          await log('error', `${source.name} menyekat akses automatik (${e.message}). Sumber ini dilangkau — pertimbangkan untuk nyahaktifkan di menu Sumber.`, source.name);
          break;
        }
        await log('error', `${e.message} — ${item.link}`, source.name);
      }
    }
    if (short && !done) await log('skip', `${short} artikel dilangkau kerana teks terlalu pendek untuk ditulis semula.`, source.name);
    await db.from('sources').update({ last_run_at: new Date().toISOString() }).eq('id', source.id);
  }

  console.log(`Selesai. ${published} artikel diterbitkan.`);
  if (published && SITE_URL && REVALIDATE_SECRET) {
    try {
      await fetch(`${SITE_URL}/api/revalidate?secret=${encodeURIComponent(REVALIDATE_SECRET)}`, { method: 'POST' });
    } catch (e) { console.warn('Revalidate gagal:', e.message); }
  }
}

main().catch(async (e) => { console.error(e); await log('error', `Run gagal: ${e.message}`); process.exit(1); });
