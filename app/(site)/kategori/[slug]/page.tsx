import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Listing from '@/components/Listing';
import { getCategory } from '@/lib/db';
import { SITE_NAME } from '@/lib/site';

export const revalidate = 300;

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return {};
  return {
    title: `Berita ${cat.name} terkini`,
    description: `Kumpulan berita dan cerita ${cat.name.toLowerCase()} terkini Malaysia di ${SITE_NAME}.`,
    alternates: { canonical: `/kategori/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: P) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) notFound();
  return <Listing page={1} category={cat} />;
}
