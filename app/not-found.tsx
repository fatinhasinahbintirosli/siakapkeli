import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="wrap" style={{ textAlign: 'center', padding: '80px 16px' }}>
      <p className="kicker">404</p>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36 }}>Halaman tidak dijumpai</h1>
      <p style={{ color: 'var(--ink-2)' }}>Mungkin artikel ini telah dipadam atau pautannya salah.</p>
      <p><Link href="/" style={{ color: 'var(--accent)', fontWeight: 700 }}>← Kembali ke laman utama</Link></p>
    </main>
  );
}
