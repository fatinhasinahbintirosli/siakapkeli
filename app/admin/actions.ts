'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminDb, requireAdmin } from '@/lib/supabase-server';
import { slugify } from '@/lib/site';

// ---------- Log masuk ----------
export async function login(_: unknown, form: FormData) {
  const db = await adminDb();
  const { error } = await db.auth.signInWithPassword({
    email: String(form.get('email') || ''), password: String(form.get('password') || ''),
  });
  if (error) return { error: 'E-mel atau kata laluan salah.' };
  redirect('/admin');
}

export async function logout() {
  const db = await adminDb();
  await db.auth.signOut();
  redirect('/admin/login');
}

// ---------- Gambar ke imgbb ----------
export async function uploadImage(form: FormData): Promise<{ url?: string; thumb?: string; error?: string }> {
  await requireAdmin();
  const file = form.get('file') as File | null;
  const url = String(form.get('url') || '');
  const body = new FormData();
  body.append('key', process.env.IMGBB_API_KEY || '');
  if (file && file.size) {
    if (file.size > 9 * 1024 * 1024) return { error: 'Gambar melebihi 9MB.' };
    body.append('image', Buffer.from(await file.arrayBuffer()).toString('base64'));
    body.append('name', slugify(file.name.replace(/\.\w+$/, '')) || 'gambar');
  } else if (url) {
    body.append('image', url);
  } else return { error: 'Tiada gambar dipilih.' };
  try {
    const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body });
    const j = await res.json();
    if (!j.success) return { error: j?.error?.message || 'imgbb gagal' };
    return { url: j.data.image?.url || j.data.url, thumb: j.data.medium?.url || j.data.thumb?.url || j.data.url };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ---------- Artikel ----------
async function uniqueSlug(db: any, base: string, id?: string) {
  let slug = base || `artikel-${Date.now()}`;
  for (let i = 2; i < 50; i++) {
    let q = db.from('posts').select('id').eq('slug', slug);
    if (id) q = q.neq('id', id);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function savePost(form: FormData) {
  const { db } = await requireAdmin();
  const id = String(form.get('id') || '') || undefined;
  const title = String(form.get('title') || '').trim();
  if (!title) redirect(id ? `/admin/posts/${id}?err=Tajuk+wajib+diisi` : '/admin/posts/new?err=Tajuk+wajib+diisi');
  const status = form.get('status') === 'published' ? 'published' : 'draft';
  const slug = await uniqueSlug(db, slugify(String(form.get('slug') || '') || title), id);
  const pubInput = String(form.get('published_at') || '');

  const row: Record<string, any> = {
    title,
    slug,
    excerpt: String(form.get('excerpt') || '') || null,
    meta_description: String(form.get('meta_description') || '') || null,
    content: String(form.get('content') || ''),
    image_url: String(form.get('image_url') || '') || null,
    image_thumb: String(form.get('image_thumb') || '') || String(form.get('image_url') || '') || null,
    image_credit: String(form.get('image_credit') || '') || null,
    category_id: String(form.get('category_id') || '') || null,
    tags: String(form.get('tags') || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10),
    status,
  };
  if (status === 'published') row.published_at = pubInput ? new Date(pubInput).toISOString() : new Date().toISOString();

  let newId = id;
  if (id) {
    if (status === 'published' && !pubInput) {
      const { data: old } = await db.from('posts').select('published_at').eq('id', id).single();
      if (old?.published_at) row.published_at = old.published_at;
    }
    const { error } = await db.from('posts').update(row).eq('id', id);
    if (error) redirect(`/admin/posts/${id}?err=${encodeURIComponent(error.message)}`);
  } else {
    const { data, error } = await db.from('posts').insert(row).select('id').single();
    if (error) redirect(`/admin/posts/new?err=${encodeURIComponent(error.message)}`);
    newId = data!.id;
  }
  revalidatePath('/', 'layout');
  redirect(`/admin/posts/${newId}?ok=1`);
}

export async function deletePost(form: FormData) {
  const { db } = await requireAdmin();
  await db.from('posts').delete().eq('id', String(form.get('id')));
  revalidatePath('/', 'layout');
  redirect('/admin/posts?ok=deleted');
}

export async function togglePost(form: FormData) {
  const { db } = await requireAdmin();
  const id = String(form.get('id'));
  const to = form.get('to') === 'published' ? 'published' : 'draft';
  const patch: any = { status: to };
  if (to === 'published') {
    const { data } = await db.from('posts').select('published_at').eq('id', id).single();
    if (!data?.published_at) patch.published_at = new Date().toISOString();
  }
  await db.from('posts').update(patch).eq('id', id);
  revalidatePath('/', 'layout');
}

// ---------- Sumber ----------
export async function saveSource(form: FormData) {
  const { db } = await requireAdmin();
  const id = String(form.get('id') || '');
  const row = {
    name: String(form.get('name') || '').trim(),
    feed_url: String(form.get('feed_url') || '').trim(),
    category_id: String(form.get('category_id') || '') || null,
    max_per_run: Math.min(10, Math.max(1, Number(form.get('max_per_run') || 2))),
    active: form.get('active') === 'on',
  };
  if (!row.name || !row.feed_url) redirect('/admin/sources?err=Nama+dan+URL+RSS+wajib');
  const { error } = id ? await db.from('sources').update(row).eq('id', id) : await db.from('sources').insert(row);
  if (error) redirect(`/admin/sources?err=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/sources');
  redirect('/admin/sources?ok=1');
}

export async function deleteSource(form: FormData) {
  const { db } = await requireAdmin();
  await db.from('sources').delete().eq('id', String(form.get('id')));
  revalidatePath('/admin/sources');
}

// ---------- Kategori ----------
export async function saveCategory(form: FormData) {
  const { db } = await requireAdmin();
  const id = String(form.get('id') || '');
  const name = String(form.get('name') || '').trim();
  if (!name) return;
  const row = { name, slug: slugify(String(form.get('slug') || '') || name) };
  id ? await db.from('categories').update(row).eq('id', id) : await db.from('categories').insert(row);
  revalidatePath('/', 'layout');
}

export async function deleteCategory(form: FormData) {
  const { db } = await requireAdmin();
  await db.from('categories').delete().eq('id', String(form.get('id')));
  revalidatePath('/', 'layout');
}

// ---------- Tetapan ----------
export async function saveSettings(form: FormData) {
  const { db } = await requireAdmin();
  await db.from('settings').upsert([
    { key: 'autopost_enabled', value: form.get('autopost_enabled') === 'on' },
    { key: 'share_enabled', value: form.get('share_enabled') === 'on' },
    { key: 'ai_extra_instructions', value: String(form.get('ai_extra_instructions') || '') },
  ]);
  revalidatePath('/admin/settings');
  redirect('/admin/settings?ok=1');
}

// ---------- Jalankan auto-post sekarang (GitHub Actions) ----------
export async function runAutopostNow() {
  await requireAdmin();
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) redirect('/admin?err=Set+GITHUB_TOKEN+dan+GITHUB_REPO+di+Vercel+dahulu');
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/autopost.yml/dispatches`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: process.env.GITHUB_BRANCH || 'main' }),
  });
  if (!res.ok) redirect(`/admin?err=${encodeURIComponent(`GitHub ${res.status}`)}`);
  redirect('/admin?ok=run');
}
