export const dynamic = 'force-static';

export function GET() {
  const client = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '').replace(/^ca-/, '');
  const body = client ? `google.com, ${client}, DIRECT, f08c47fec0942fa0\n` : '# AdSense belum disetkan\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
