import { Header } from '@/components/Site';

export default function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="wrap">
        <div className="page-content prose">
          <h1>{title}</h1>
          {children}
        </div>
      </main>
    </>
  );
}
