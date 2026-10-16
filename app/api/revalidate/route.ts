import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// Dipanggil oleh skrip auto-post selepas terbit artikel baru
export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
