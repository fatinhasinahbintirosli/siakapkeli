import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { ADSENSE_CLIENT, SITE_DESC, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

// Font disimpan sendiri oleh Next.js (tiada permintaan ke Google Fonts semasa dimuat = lebih laju)
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Berita Viral & Terkini Malaysia`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESC,
  alternates: { canonical: '/', types: { 'application/rss+xml': `${SITE_URL}/rss.xml` } },
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'ms_MY', url: SITE_URL },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  verification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } : undefined,
  other: ADSENSE_CLIENT ? { 'google-adsense-account': ADSENSE_CLIENT } : undefined,
};

export const viewport: Viewport = { themeColor: '#0A0A0A', width: 'device-width', initialScale: 1, colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'ms-MY',
    potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/cari?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };
  return (
    <html lang="ms" className={`${inter.variable} ${mono.variable}`}>
      <head>
        {/* Sambung awal ke pelayan gambar imgbb supaya gambar pertama muncul lebih cepat */}
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
      </head>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        {ADSENSE_CLIENT && (
          // lazyOnload: iklan dimuat selepas kandungan siap, supaya laman tak jadi perlahan
          <Script id="adsense" strategy="lazyOnload" crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} />
        )}
      </body>
    </html>
  );
}
