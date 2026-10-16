import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata = { title: 'Terma Penggunaan', alternates: { canonical: '/terma' } };

export default function Page() {
  return (
    <StaticPage title="Terma Penggunaan">
      <p>Dengan menggunakan {SITE_NAME}, anda bersetuju dengan terma berikut.</p>
      <h2>Kandungan</h2>
      <p>Artikel di laman ini disediakan untuk maklumat umum dan hiburan. Kami berusaha memastikan ketepatan, namun tidak menjamin setiap maklumat sentiasa terkini. Rujuk sumber asal yang dipautkan untuk laporan penuh.</p>
      <h2>Hak cipta</h2>
      <p>Gambar dan maklumat yang dirujuk kekal hak milik pemilik asal dan dikreditkan pada setiap artikel. Pemilik hak cipta boleh memohon penurunan melalui halaman <a href="/hubungi-kami">Hubungi Kami</a>.</p>
      <h2>Penafian</h2>
      <p>{SITE_NAME} tidak bertanggungjawab atas sebarang kerugian akibat penggunaan maklumat di laman ini.</p>
    </StaticPage>
  );
}
