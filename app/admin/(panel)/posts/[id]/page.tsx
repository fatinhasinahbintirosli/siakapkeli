import { notFound } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { deletePost } from '../../../actions';
import { requireAdmin } from '@/lib/supabase-server';

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { db } = await requireAdmin();
  const [{ data: post }, { data: cats }] = await Promise.all([
    db.from('posts').select('*').eq('id', id).maybeSingle(),
    db.from('categories').select('id, name').order('name'),
  ]);
  if (!post) notFound();
  return (
    <>
      <h1>
        Sunting artikel
        <form action={deletePost} style={{ marginLeft: 'auto' }}>
          <input type="hidden" name="id" value={post.id} />
          <ConfirmButton message="Padam artikel ini? Tindakan ini tidak boleh diundur." className="btn danger">Padam</ConfirmButton>
        </form>
      </h1>
      {sp.ok && <div className="notice">Disimpan.</div>}
      {sp.err && <div className="notice err">{sp.err}</div>}
      <PostEditor key={post.updated_at} post={post} categories={cats || []} />
    </>
  );
}
