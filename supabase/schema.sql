-- ============================================================
-- Siakap Keli — skema database Supabase
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
-- ============================================================

create extension if not exists pgcrypto;

-- Kategori -----------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Artikel ------------------------------------------------------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  meta_description text,
  image_url text,
  image_thumb text,
  image_credit text,
  source_url text unique,
  source_name text,
  category_id uuid references categories(id) on delete set null,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  auto boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_pub_idx on posts (status, published_at desc);
create index if not exists posts_category_idx on posts (category_id, published_at desc);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_updated_at on posts;
create trigger posts_updated_at before update on posts
for each row execute function set_updated_at();

-- Sumber auto-post (RSS) --------------------------------------
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  category_id uuid references categories(id) on delete set null,
  max_per_run int not null default 2,
  active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

-- Tetapan ------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value jsonb not null
);

-- Log auto-post -----------------------------------------------
create table if not exists autopost_logs (
  id bigserial primary key,
  run_at timestamptz not null default now(),
  source_name text,
  status text not null,           -- ok | skip | error
  message text,
  post_id uuid references posts(id) on delete set null
);
create index if not exists autopost_logs_run_idx on autopost_logs (run_at desc);

-- ============================================================
-- Keselamatan (RLS)
-- Orang awam: baca artikel terbit & kategori sahaja.
-- Admin (pengguna log masuk Supabase Auth): akses penuh.
-- Skrip auto-post guna service_role key (langkau RLS).
-- ============================================================
alter table categories enable row level security;
alter table posts enable row level security;
alter table sources enable row level security;
alter table settings enable row level security;
alter table autopost_logs enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);

drop policy if exists "public read published posts" on posts;
create policy "public read published posts" on posts for select using (status = 'published');

drop policy if exists "admin all categories" on categories;
create policy "admin all categories" on categories for all to authenticated using (true) with check (true);

drop policy if exists "admin all posts" on posts;
create policy "admin all posts" on posts for all to authenticated using (true) with check (true);

drop policy if exists "admin all sources" on sources;
create policy "admin all sources" on sources for all to authenticated using (true) with check (true);

drop policy if exists "admin all settings" on settings;
create policy "admin all settings" on settings for all to authenticated using (true) with check (true);

drop policy if exists "admin read logs" on autopost_logs;
create policy "admin read logs" on autopost_logs for select to authenticated using (true);

-- ============================================================
-- Data permulaan
-- ============================================================
insert into categories (name, slug) values
  ('Viral', 'viral'),
  ('Semasa', 'semasa'),
  ('Hiburan', 'hiburan'),
  ('Sukan', 'sukan'),
  ('Gaya Hidup', 'gaya-hidup'),
  ('Kisah', 'kisah')
on conflict (slug) do nothing;

insert into settings (key, value) values
  ('autopost_enabled', 'true'::jsonb),
  ('ai_extra_instructions', '""'::jsonb)
on conflict (key) do nothing;

-- Sumber contoh. Semak URL RSS di admin > Sumber, tambah/padam ikut suka.
insert into sources (name, feed_url, category_id, max_per_run)
select 'Harian Metro', 'https://www.hmetro.com.my/feed', id, 2 from categories where slug = 'viral'
on conflict (feed_url) do nothing;
insert into sources (name, feed_url, category_id, max_per_run)
select 'Berita Harian', 'https://www.bharian.com.my/feed', id, 2 from categories where slug = 'semasa'
on conflict (feed_url) do nothing;
insert into sources (name, feed_url, category_id, max_per_run)
select 'Astro Awani', 'https://www.astroawani.com/rss/terkini/public', id, 2 from categories where slug = 'semasa'
on conflict (feed_url) do nothing;
insert into sources (name, feed_url, category_id, max_per_run)
select 'mStar', 'https://www.mstar.com.my/rss/terkini', id, 2 from categories where slug = 'hiburan'
on conflict (feed_url) do nothing;
insert into sources (name, feed_url, category_id, max_per_run)
select 'OH! Media', 'https://ohbulan.com/feed/', id, 2 from categories where slug = 'kisah'
on conflict (feed_url) do nothing;
