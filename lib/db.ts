import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PER_PAGE } from './site';

// Klien awam (anon) — hanya nampak artikel terbit. Selamat untuk ISR/cache.
export const publicDb = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

export type Category = { id: string; name: string; slug: string };
export type Post = {
  id: string; title: string; slug: string; excerpt: string | null; content: string;
  meta_description: string | null; image_url: string | null; image_thumb: string | null;
  image_credit: string | null; source_url: string | null; source_name: string | null;
  category_id: string | null; tags: string[]; status: string; published_at: string | null;
  updated_at: string; categories?: Category | null; fb_hook?: string | null;
};

const CARD = 'id, title, slug, excerpt, image_thumb, image_url, published_at, categories(id, name, slug)';

export async function getLatest(page = 1, categoryId?: string) {
  const from = (page - 1) * PER_PAGE;
  let q = publicDb().from('posts').select(CARD, { count: 'exact' })
    .eq('status', 'published').order('published_at', { ascending: false }).range(from, from + PER_PAGE - 1);
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, count } = await q;
  return { posts: (data || []) as unknown as Post[], total: count || 0 };
}

export const getPost = cache(async function getPost(slug: string) {
  const { data } = await publicDb().from('posts').select('*, categories(id, name, slug)')
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  return data as Post | null;
});

export async function getRelated(post: Post, limit = 4) {
  let q = publicDb().from('posts').select(CARD).eq('status', 'published').neq('id', post.id)
    .order('published_at', { ascending: false }).limit(limit);
  if (post.category_id) q = q.eq('category_id', post.category_id);
  const { data } = await q;
  return (data || []) as unknown as Post[];
}

export const getCategories = cache(async function getCategories() {
  const { data } = await publicDb().from('categories').select('id, name, slug').order('name');
  return (data || []) as Category[];
});

export const getCategory = cache(async function getCategory(slug: string) {
  const { data } = await publicDb().from('categories').select('id, name, slug').eq('slug', slug).maybeSingle();
  return data as Category | null;
});

export async function searchPosts(q: string) {
  const term = q.replace(/[%,()]/g, ' ').trim();
  if (!term) return [];
  const { data } = await publicDb().from('posts').select(CARD).eq('status', 'published')
    .or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`).order('published_at', { ascending: false }).limit(30);
  return (data || []) as unknown as Post[];
}
