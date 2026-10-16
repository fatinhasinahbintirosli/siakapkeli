import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Klien Supabase dengan sesi admin (cookie). Hanya untuk /admin.
export async function adminDb() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {}
      },
    },
  });
}

export async function requireAdmin() {
  const db = await adminDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/admin/login');
  return { db, user };
}
