import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ADSENSE_CLIENT, SITE_DESC, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#16130f' },
    { media: '(prefers-color-scheme: dark)', color: '#12110f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

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
    <html lang="ms">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        {ADSENSE_CLIENT && (
          <Script id="adsense" async strategy="afterInteractive" crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} />
        )}
      </body>
    </html>
  );
}
