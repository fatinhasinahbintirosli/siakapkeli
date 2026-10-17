'use client';
import { useEffect, useRef, useState } from 'react';
import { savePost, uploadImage } from '@/app/admin/actions';

type Cat = { id: string; name: string };

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default function PostEditor({ post, categories }: { post?: any; categories: Cat[] }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>(post?.content || '<p></p>');
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [img, setImg] = useState({ url: post?.image_url || '', thumb: post?.image_thumb || '' });
  const [busy, setBusy] = useState('');
  const [metaLen, setMetaLen] = useState((post?.meta_description || '').length);
  const [pubLocal, setPubLocal] = useState(toLocalInput(post?.published_at));

  useEffect(() => {
    if (mode === 'visual' && editorRef.current && editorRef.current.innerHTML !== html) editorRef.current.innerHTML = html;
  }, [mode]); // eslint-disable-line

  const sync = () => editorRef.current && setHtml(editorRef.current.innerHTML);
  const cmd = (c: string, v?: string) => { editorRef.current?.focus(); document.execCommand(c, false, v); sync(); };

  async function doUpload(file?: File, url?: string) {
    const fd = new FormData();
    if (file) fd.append('file', file);
    if (url) fd.append('url', url);
    setBusy('Memuat naik ke imgbb…');
    const r = await uploadImage(fd);
    setBusy('');
    if (r.error) { alert(r.error); return null; }
    return r;
  }

  async function insertImage() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const r = await doUpload(f);
      if (r?.url) cmd('insertHTML', `<img src="${r.url}" alt="" />`);
    };
    input.click();
  }

  return (
    <form action={savePost} onSubmit={() => mode === 'visual' && sync()}>
      <input type="hidden" name="id" value={post?.id || ''} />
      <input type="hidden" name="content" value={html} />
      <input type="hidden" name="image_url" value={img.url} />
      <input type="hidden" name="image_thumb" value={img.thumb} />

      <div className="editor-grid">
        <div>
          <div className="panel">
            <input className="title-input" type="text" name="title" defaultValue={post?.title} placeholder="Tajuk artikel" required />
          </div>
          <div className="toolbar">
            {mode === 'visual' && <>
              <button type="button" onClick={() => cmd('formatBlock', 'P')} title="Perenggan">¶</button>
              <button type="button" onClick={() => cmd('formatBlock', 'H2')} title="Subtajuk">H2</button>
              <button type="button" onClick={() => cmd('formatBlock', 'H3')} title="Subtajuk kecil">H3</button>
              <span className="sep" />
              <button type="button" onClick={() => cmd('bold')} title="Tebal"><b>B</b></button>
              <button type="button" onClick={() => cmd('italic')} title="Condong"><i>I</i></button>
              <button type="button" onClick={() => cmd('underline')} title="Garis bawah"><u>U</u></button>
              <span className="sep" />
              <button type="button" onClick={() => cmd('insertUnorderedList')} title="Senarai">• ≡</button>
              <button type="button" onClick={() => cmd('insertOrderedList')} title="Senarai bernombor">1.</button>
              <button type="button" onClick={() => cmd('formatBlock', 'BLOCKQUOTE')} title="Petikan">❝</button>
              <span className="sep" />
              <button type="button" onClick={() => { const u = prompt('URL pautan:'); if (u) cmd('createLink', u); }} title="Pautan">🔗</button>
              <button type="button" onClick={() => cmd('unlink')} title="Buang pautan">⛓̸</button>
              <button type="button" onClick={insertImage} title="Masukkan gambar (imgbb)">🖼</button>
              <button type="button" onClick={() => { const u = prompt('URL YouTube (embed):'); const m = u?.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/); if (m) cmd('insertHTML', `<iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" allowfullscreen></iframe><p></p>`); }} title="Video YouTube">▶</button>
              <button type="button" onClick={() => cmd('removeFormat')} title="Buang format">⌫</button>
              <span className="sep" />
            </>}
            <button type="button" onClick={() => { if (mode === 'visual') sync(); setMode(mode === 'visual' ? 'html' : 'visual'); }} style={{ marginLeft: 'auto', padding: '0 10px' }}>
              {mode === 'visual' ? '</> HTML' : '👁 Visual'}
            </button>
          </div>
          {mode === 'visual'
            ? <div ref={editorRef} className="rich" contentEditable suppressContentEditableWarning onInput={sync} onBlur={sync} />
            : <textarea className="html-src" value={html} onChange={(e) => setHtml(e.target.value)} />}
          {busy && <p className="mut">{busy}</p>}
        </div>

        <div>
          <div className="panel">
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={post?.status || 'published'}>
                <option value="published">Terbit</option>
                <option value="draft">Draf</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="published_at">Tarikh terbit</label>
              <input id="published_at" type="datetime-local" value={pubLocal} onChange={(e) => setPubLocal(e.target.value)} style={{ width: '100%' }} />
              <input type="hidden" name="published_at" value={pubLocal ? new Date(pubLocal).toISOString() : ''} />
              <small>Kosongkan untuk guna masa sekarang.</small>
            </div>
            <div className="row">
              <button className="btn pri" style={{ flex: 1, justifyContent: 'center' }}>💾 Simpan</button>
              {post?.status === 'published' && <a className="btn" href={`/${post.slug}`} target="_blank">Lihat ↗</a>}
            </div>
          </div>

          <div className="panel">
            <h2>Gambar utama</h2>
            {img.url ? <img className="img-preview" src={img.thumb || img.url} alt="" /> : <div className="img-preview" />}
            <div className="row" style={{ marginTop: 10 }}>
              <label className="btn sm">
                Muat naik
                <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const r = await doUpload(f); if (r?.url) setImg({ url: r.url, thumb: r.thumb || r.url }); } }} />
              </label>
              <button type="button" className="btn sm" onClick={async () => { const u = prompt('URL gambar (akan disalin ke imgbb):'); if (u) { const r = await doUpload(undefined, u); if (r?.url) setImg({ url: r.url, thumb: r.thumb || r.url }); } }}>Dari URL</button>
              {img.url && <button type="button" className="btn sm danger" onClick={() => setImg({ url: '', thumb: '' })}>Buang</button>}
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label htmlFor="image_credit">Kredit gambar</label>
              <input id="image_credit" type="text" name="image_credit" defaultValue={post?.image_credit || ''} placeholder="cth: Harian Metro" />
            </div>
          </div>

          <div className="panel">
            <h2>Kategori & tag</h2>
            <div className="field">
              <select name="category_id" defaultValue={post?.category_id || ''} aria-label="Kategori">
                <option value="">— Tiada —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tags">Tag (asingkan dengan koma)</label>
              <input id="tags" type="text" name="tags" defaultValue={(post?.tags || []).join(', ')} />
            </div>
          </div>

          <div className="panel">
            <h2>SEO</h2>
            <div className="field">
              <label htmlFor="slug">Slug URL</label>
              <input id="slug" type="text" name="slug" defaultValue={post?.slug || ''} placeholder="auto dari tajuk" />
            </div>
            <div className="field">
              <label htmlFor="excerpt">Ringkasan (lede)</label>
              <textarea id="excerpt" name="excerpt" defaultValue={post?.excerpt || ''} />
            </div>
            <div className="field">
              <label htmlFor="meta_description">Meta description <span className="mut">({metaLen}/155)</span></label>
              <textarea id="meta_description" name="meta_description" maxLength={160} defaultValue={post?.meta_description || ''} onChange={(e) => setMetaLen(e.target.value.length)} />
            </div>
          </div>

          {post?.source_url && (
            <div className="panel">
              <h2>Sumber</h2>
              <a href={post.source_url} target="_blank" rel="noopener" style={{ wordBreak: 'break-all', color: '#FF3E00' }}>{post.source_name}: {post.source_url}</a>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
