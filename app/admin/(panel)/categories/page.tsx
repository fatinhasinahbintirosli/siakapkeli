import { deleteCategory, saveCategory } from '../../actions';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { requireAdmin } from '@/lib/supabase-server';

export default async function CategoriesPage() {
  const { db } = await requireAdmin();
  const { data: cats } = await db.from('categories').select('id, name, slug').order('name');
  return (
    <>
      <h1>Kategori</h1>
      <div className="panel">
        <form action={saveCategory} className="row">
          <input type="text" name="name" placeholder="Nama kategori baru" required style={{ flex: 1 }} />
          <button className="btn pri">Tambah</button>
        </form>
      </div>
      <div className="panel" style={{ padding: 0 }}>
        <table className="tbl">
          <thead><tr><th>Nama</th><th>Slug</th><th></th></tr></thead>
          <tbody>
            {(cats || []).map((c) => (
              <tr key={c.id}>
                <td colSpan={2}>
                  <form action={saveCategory} className="row">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="text" name="name" defaultValue={c.name} style={{ flex: 1 }} />
                    <input type="text" name="slug" defaultValue={c.slug} style={{ flex: 1 }} />
                    <button className="btn sm">Simpan</button>
                  </form>
                </td>
                <td style={{ width: 1 }}>
                  <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={`Padam kategori ${c.name}? Artikel di dalamnya tidak dipadam.`}>✕</ConfirmButton></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
