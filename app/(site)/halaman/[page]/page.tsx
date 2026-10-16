import type { Metadata } from 'next';
import Listing from '@/components/Listing';

export const revalidate = 300;

type P = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { page } = await params;
  return { title: `Berita terkini — halaman ${page}`, alternates: { canonical: `/halaman/${page}` } };
}

export default async function Page({ params }: P) {
  const { page } = await params;
  return <Listing page={Number(page)} />;
}
