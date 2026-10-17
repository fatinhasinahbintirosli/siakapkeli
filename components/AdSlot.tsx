'use client';
import { useEffect, useRef } from 'react';

// Slot iklan manual AdSense. Kalau slot ID kosong, tiada apa dipaparkan
// (Auto Ads masih berfungsi melalui skrip di layout).
//   in-article → unit "In-article ads" (antara perenggan)
//   display    → unit "Display ads" responsif (senarai / hujung artikel)
//   vertical   → unit "Display ads" bentuk tegak (sidebar)
//   multiplex  → unit "Multiplex ads" (grid kandungan disyorkan)
type Variant = 'display' | 'in-article' | 'vertical' | 'multiplex';

export default function AdSlot({ slot, variant = 'display' }: { slot?: string; variant?: Variant }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const pushed = useRef(false);
  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    pushed.current = true;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [client, slot]);
  if (!client || !slot) return null;

  const common = { className: 'adsbygoogle', 'data-ad-client': client, 'data-ad-slot': slot } as const;
  return (
    <div className={`ad ad-${variant}`}>
      <div className="ad-label">Iklan</div>
      {variant === 'in-article' && (
        <ins {...common} style={{ display: 'block', textAlign: 'center' }} data-ad-layout="in-article" data-ad-format="fluid" />
      )}
      {variant === 'multiplex' && <ins {...common} style={{ display: 'block' }} data-ad-format="autorelaxed" />}
      {variant === 'vertical' && (
        <ins {...common} style={{ display: 'block', minHeight: 250 }} data-ad-format="vertical" data-full-width-responsive="true" />
      )}
      {variant === 'display' && (
        <ins {...common} style={{ display: 'block' }} data-ad-format="auto" data-full-width-responsive="true" />
      )}
    </div>
  );
}
