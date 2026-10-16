import PostEditor from '@/components/admin/PostEditor';
import { requireAdmin } from '@/lib/supabase-server';

export default async function NewPost({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const { db } = await requireAdmin();
  const { data: cats } = await db.from('categories').select('id, name').order('name');
  return (
    <>
      <h1>Tulis artikel baru</h1>
      {sp.err && <div className="notice err">{sp.err}</div>}
      <PostEditor categories={cats || []} />
    </>
  );
}
