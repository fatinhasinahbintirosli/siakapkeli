'use client';
import { useState } from 'react';

// "Sambung Baca" — hanya di telefon (≤760px). Di desktop artikel dipaparkan penuh.
// Teks penuh sentiasa ada dalam HTML, jadi Google tetap membaca keseluruhan artikel (SEO selamat).
// Susunan: [awal artikel + pudar] → [iklan] → [jarak + garis] → [butang SAMBUNG BACA] → [baki artikel]
// Butang diletak di BAWAH iklan dengan jarak yang jelas, bukan di atas iklan,
// supaya tiada klik iklan tak sengaja (dilarang polisi AdSense).
export default function ReadMore({ head, ad, children }: { head: React.ReactNode; ad?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rm${open ? ' open' : ''}`}>
      <div className="rm-head">{head}</div>
      {ad}
      <div className="rm-cta">
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open}>
          Sambung Baca <span aria-hidden="true">↓</span>
        </button>
      </div>
      <div className="rm-body">{children}</div>
      <noscript><style>{'.rm .rm-body{display:block!important}.rm .rm-cta{display:none!important}.rm .rm-head::after{display:none!important}'}</style></noscript>
    </div>
  );
}
