import Listing from '@/components/Listing';

export const revalidate = 1800; // refresh serta-merta selepas auto-post

export default function Home() {
  return <Listing page={1} />;
}
