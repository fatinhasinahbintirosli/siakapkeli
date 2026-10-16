# Siakap Keli — blog berita auto-post

Website berita yang mencari cerita baru setiap 2 jam, menulis semula guna Google Gemini, menyimpan gambar di imgbb, dan menerbitkannya terus. Ada panel admin untuk tulis, sunting dan urus semuanya macam Blogspot.

**Teknologi:** Next.js 15 (Vercel) · Supabase (database + log masuk admin) · imgbb (gambar) · Gemini (AI) · GitHub Actions (jadual auto-post)

```
RSS sumber ──► GitHub Actions (setiap 2 jam) ──► baca artikel ──► Gemini tulis semula
                                                            └──► gambar ke imgbb
                                    Supabase ◄── simpan & terbit ┘
                                        │
                     Vercel (website + /admin) ──► pembaca & Google
```

---

## Langkah pemasangan (±30 minit)

### 1. Dapatkan kunci (semua percuma untuk mula)

| Perkhidmatan | Di mana | Apa yang perlu disalin |
|---|---|---|
| Supabase | supabase.com → New project | Project URL, `anon` key, `service_role` key (Settings → API) |
| imgbb | api.imgbb.com | API key |
| Gemini | aistudio.google.com → Get API key | API key |

### 2. Sediakan database

1. Supabase → **SQL Editor** → New query.
2. Tampal seluruh isi `supabase/schema.sql` → **Run**.
3. **Authentication → Users → Add user**: masukkan e-mel & kata laluan admin awak.
4. **Authentication → Sign In / Providers → Email**: matikan **Allow new users to sign up**, supaya tiada orang lain boleh daftar sebagai admin.

### 3. Muat naik kod ke GitHub

1. Buat repo baru (boleh *private*), contoh `siakapkeli`.
2. Muat naik semua fail dalam folder ini (atau `git push`).

### 4. Pasang di Vercel

1. vercel.com → **Add New → Project** → pilih repo tadi → Import.
2. Sebelum Deploy, buka **Environment Variables** dan isi semua dari `.env.example`:
   - `NEXT_PUBLIC_SITE_URL` = `https://siakapkeli.me`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `IMGBB_API_KEY`, `GEMINI_API_KEY`
   - `REVALIDATE_SECRET` = teks rawak panjang rekaan sendiri
   - `NEXT_PUBLIC_ADSENSE_CLIENT`: biarkan kosong sehingga AdSense lulus
3. **Deploy**.
4. **Settings → Domains** → tambah `siakapkeli.me` dan ikut arahan DNS di pendaftar domain awak.

### 5. Hidupkan auto-post di GitHub

Repo → **Settings → Secrets and variables → Actions**.

**Secrets** (tab Secrets):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `IMGBB_API_KEY`
- `REVALIDATE_SECRET` (sama dengan di Vercel)

**Variables** (tab Variables):
- `NEXT_PUBLIC_SITE_URL` = `https://siakapkeli.me`
- `GEMINI_MODEL` = `gemini-2.5-flash` (pilihan)

Uji sekali: tab **Actions → Auto-post artikel → Run workflow**. Selepas 2–5 minit, artikel pertama patut muncul di website, dan log di `/admin`.

### 6. (Pilihan) Butang "Jalankan sekarang" di admin

Buat token GitHub: Settings → Developer settings → Fine-grained tokens → akses repo ini sahaja, kebenaran **Actions: Read and write**. Masukkan di Vercel:
- `GITHUB_TOKEN` = token tadi
- `GITHUB_REPO` = `namaawak/siakapkeli`

---

## Panel admin — `siakapkeli.me/admin`

| Menu | Fungsi |
|---|---|
| Papan Utama | Statistik, log auto-post, butang jalankan sekarang |
| Artikel | Senarai, tapis (terbit/draf/auto), cari, terbit/nyahterbit, padam |
| Tulis Baru / Sunting | Editor visual (tebal, subtajuk, senarai, pautan, gambar, YouTube) + mod HTML, gambar utama ke imgbb, kategori, tag, slug, meta description, jadual terbit |
| Sumber Auto-post | Tambah/ubah URL RSS, had artikel setiap pusingan, aktif/tidak |
| Kategori | Tambah, ubah nama/slug, padam |
| Tetapan | Hidup/matikan auto-post, arahan tambahan untuk gaya tulisan AI |

**Menambah sumber sendiri:** kebanyakan laman berita ada RSS. Cuba `namalaman.com/feed` atau cari ikon RSS di laman itu. Sumber contoh dalam `schema.sql` perlu disemak; kalau log tunjuk "RSS gagal", gantikan URL di menu Sumber.

---

## SEO & AdSense yang sudah terbina

- Sitemap automatik `/sitemap.xml` (termasuk gambar), `robots.txt`, feed `/rss.xml`
- Schema `NewsArticle`, `BreadcrumbList`, `WebSite` + kotak carian
- Meta title/description, Open Graph & Twitter Card setiap artikel, canonical URL
- Halaman laju: kandungan dijana statik dan dikemas kini setiap 5–10 minit, tiada font luar
- Halaman wajib AdSense: Tentang Kami, Hubungi Kami, Dasar Privasi, Terma
- `/ads.txt` automatik dari `NEXT_PUBLIC_ADSENSE_CLIENT`
- Slot iklan: dalam artikel (selepas perenggan ke-3 & hujung) dan dalam senarai. Auto Ads juga aktif.

**Selepas deploy:** daftar laman di Google Search Console dan hantar `https://siakapkeli.me/sitemap.xml`. Mohon AdSense selepas ada sekurang-kurangnya 30–50 artikel.

---

## Kos & had

- Vercel, Supabase, imgbb, GitHub Actions: pelan percuma mencukupi untuk mula.
- Gemini: kuota percuma terhad sehari. Jika log tunjuk ralat 429, kurangkan "Had/pusingan" sumber atau aktifkan bil di Google AI Studio (gemini-2.5-flash sangat murah).
- Setiap pusingan: had × bilangan sumber. Contoh 5 sumber × 2 = maksimum 10 artikel setiap 2 jam.

## Menjalankan di komputer sendiri

```bash
cp .env.example .env.local   # isi semua kunci
npm install
npm run dev                  # http://localhost:3000
npm run autopost             # uji enjin auto-post sekali guna .env.local
```
