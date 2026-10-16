'use client';
import { useEffect, useRef } from 'react';

// Slot iklan manual. Kalau slot ID kosong, tiada apa dipaparkan
// (Auto Ads AdSense masih berfungsi melalui skrip di layout).
export default function AdSlot({ slot, format = 'auto' }: { slot?: string; format?: string }) {
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
  return (
    <div className="ad">
      <div className="ad-label">Iklan</div>
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client={client} data-ad-slot={slot}
        data-ad-format={format} data-full-width-responsive="true" />
    </div>
  );
}
