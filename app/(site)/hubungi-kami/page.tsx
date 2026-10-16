import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'Hubungi Kami', alternates: { canonical: '/hubungi-kami' } };

export default function Page() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'admin@siakapkeli.me';
  return (
    <StaticPage title="Hubungi Kami">
      <p>Untuk sebarang pertanyaan, cadangan cerita, kerjasama pengiklanan, atau permohonan pembetulan dan penurunan kandungan, hubungi kami melalui e-mel:</p>
      <p><strong><a href={`mailto:${email}`}>{email}</a></strong></p>
      <p>Bagi aduan hak cipta, sertakan pautan artikel kami dan bukti pemilikan kandungan. Kami akan menyemak dan mengambil tindakan secepat mungkin, biasanya dalam masa 48 jam.</p>
    </StaticPage>
  );
}
