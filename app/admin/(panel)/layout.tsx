import Link from 'next/link';
import { logout } from '../actions';
import { requireAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="adm">
      <nav className="adm-side">
        <div className="brand">Siakap <span>Keli</span></div>
        <Link href="/admin">Papan Utama</Link>
        <Link href="/admin/posts">Artikel</Link>
        <Link href="/admin/posts/new">+ Tulis Baru</Link>
        <Link href="/admin/sources">Sumber Auto-post</Link>
        <Link href="/admin/categories">Kategori</Link>
        <Link href="/admin/settings">Tetapan</Link>
        <Link href="/" target="_blank">Lihat Website ↗</Link>
        <form action={logout}><button className="btn sm" style={{ background: 'transparent', color: '#d9d3c9', borderColor: '#3a352e' }}>Log keluar</button></form>
      </nav>
      <div className="adm-main">{children}</div>
    </div>
  );
}
