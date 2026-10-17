import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Listing from '@/components/Listing';
import { getCategory } from '@/lib/db';

export const revalidate = 1800; // refresh serta-merta selepas auto-post
// Jana bila pertama kali dilawati, kemudian simpan dalam cache (ISR) — bukan dijana setiap kali
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

type P = { params: Promise<{ slug: string; page: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug, page } = await params;
  const cat = await getCategory(slug);
  if (!cat) return {};
  return { title: `Berita ${cat.name} — halaman ${page}`, alternates: { canonical: `/kategori/${slug}/halaman/${page}` } };
}

export default async function Page({ params }: P) {
  const { slug, page } = await params;
  const cat = await getCategory(slug);
  if (!cat) notFound();
  return <Listing page={Number(page)} category={cat} />;
}
