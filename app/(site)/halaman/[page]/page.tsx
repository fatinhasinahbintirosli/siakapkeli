import type { Metadata } from 'next';
import Listing from '@/components/Listing';

export const revalidate = 1800; // refresh serta-merta selepas auto-post
// Jana bila pertama kali dilawati, kemudian simpan dalam cache (ISR) — bukan dijana setiap kali
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

type P = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { page } = await params;
  return { title: `Berita terkini — halaman ${page}`, alternates: { canonical: `/halaman/${page}` } };
}

export default async function Page({ params }: P) {
  const { page } = await params;
  return <Listing page={Number(page)} />;
}
