import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata = { title: 'Tentang Kami', alternates: { canonical: '/tentang-kami' } };

export default function Page() {
  return (
    <StaticPage title="Tentang Kami">
      <p>{SITE_NAME} ialah portal berita santai yang mengumpul dan menceritakan semula kisah viral, berita semasa, hiburan dan gaya hidup di Malaysia dalam bahasa yang mudah difahami.</p>
      <p>Kami merujuk pelbagai media dan sentiasa menyertakan pautan kepada sumber asal di hujung setiap artikel supaya pembaca boleh membaca laporan penuh.</p>
      <p>Ada cadangan cerita, pembetulan fakta atau aduan? Sila ke halaman <a href="/hubungi-kami">Hubungi Kami</a>.</p>
    </StaticPage>
  );
}
