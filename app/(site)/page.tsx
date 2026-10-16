import Listing from '@/components/Listing';

export const revalidate = 300;

export default function Home() {
  return <Listing page={1} />;
}
