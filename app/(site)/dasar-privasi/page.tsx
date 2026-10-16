import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata = { title: 'Dasar Privasi', alternates: { canonical: '/dasar-privasi' } };

export default function Page() {
  return (
    <StaticPage title="Dasar Privasi">
      <p>Dasar ini menerangkan bagaimana {SITE_NAME} mengumpul dan menggunakan maklumat apabila anda melayari laman ini.</p>
      <h2>Maklumat yang dikumpul</h2>
      <p>Kami tidak meminta anda mendaftar. Data teknikal seperti jenis pelayar, peranti dan halaman yang dilawati mungkin dikumpul secara automatik untuk tujuan statistik dan keselamatan.</p>
      <h2>Kuki dan pengiklanan</h2>
      <p>Laman ini menggunakan Google AdSense. Pembekal pihak ketiga, termasuk Google, menggunakan kuki untuk memaparkan iklan berdasarkan lawatan anda ke laman ini dan laman lain di Internet. Penggunaan kuki pengiklanan membolehkan Google dan rakan kongsinya memaparkan iklan kepada anda.</p>
      <p>Anda boleh menutup iklan diperibadikan melalui <a href="https://adssettings.google.com" target="_blank" rel="noopener">Tetapan Iklan Google</a>, atau menutup kuki pembekal pihak ketiga melalui <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener">aboutads.info</a>. Maklumat lanjut: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">cara Google menggunakan data</a>.</p>
      <h2>Pautan luar</h2>
      <p>Artikel kami mengandungi pautan ke laman lain. Kami tidak bertanggungjawab ke atas amalan privasi laman tersebut.</p>
      <h2>Perubahan</h2>
      <p>Dasar ini boleh dikemas kini dari semasa ke semasa. Teruskan melayari laman ini bermakna anda bersetuju dengan dasar terkini.</p>
    </StaticPage>
  );
}
