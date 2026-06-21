import React, { useState, useEffect, useRef } from 'react';
import { useAdminCRUD, ConfirmDialog, Field } from './adminUtils';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

const empty = (cat = '') => ({ category: cat, title: '', description: '', imageUrl: '', link: '', content: '' });

export default function ArticlesTab({ token }) {
  const { items, loading, create, update, remove, renderToast, showToast } = useAdminCRUD('articles', token);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null); // null means adding new, string means editing
  const fileInputRef = useRef(null);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAdd = () => { 
    setForm(empty(categories[0] || '')); 
    setEditId(null);
    setIsEditing(true); 
  };
  const openEdit = (item) => { 
    setForm({ 
      category: item.category, 
      title: item.title, 
      description: item.description, 
      imageUrl: item.imageUrl || '', 
      link: item.link || '', 
      content: item.content || '' 
    }); 
    setEditId(item.id);
    setIsEditing(true); 
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài viết!', 'error');
      return;
    }
    if (!form.description.trim()) {
      showToast('Vui lòng nhập mô tả bài viết!', 'error');
      return;
    }
    setSaving(true);
    if (!editId) await create(form);
    else await update(editId, form);
    setSaving(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await remove(confirmId);
    setConfirmId(null);
  };

  const handleAddCategory = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        showToast('Thêm danh mục thành công!', 'success');
        await loadCategories();
        setForm(f => ({ ...f, category: name }));
      } else {
        const err = await res.json();
        showToast(err.error || 'Lỗi khi thêm danh mục', 'error');
      }
    } catch {
      showToast('Lỗi kết nối mạng', 'error');
    }
  };

  const insertTag = (before, after = '') => {
    const textarea = document.getElementById('article-content-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setForm(f => ({ ...f, content: newValue }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      showToast('Đang tải ảnh lên...', 'info');
      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        insertTag(`<img src="${data.url}" alt="Hình ảnh" style="max-width:100%; height:auto; border-radius:12px; margin:16px 0; display:block;" />`);
        showToast('Tải ảnh lên thành công!', 'success');
      } else {
        showToast('Lỗi tải ảnh lên!', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi tải ảnh lên!', 'error');
    }
    e.target.value = '';
  };

  const [filterCat, setFilterCat] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filtered = items.filter(item => filterCat === 'Tất cả' || item.category === filterCat);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (isEditing) {
    return (
      <div className="admin-editor-view" style={{ padding: '8px' }}>
        {/* Editor Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsEditing(false)} 
              className="admin-edit-btn"
              style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'var(--admin-surface2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontWeight: 600 }}
            >
              ← Quay lại danh sách
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
              {editId ? '📝 Chỉnh sửa bài viết' : '✨ Thêm bài viết mới'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setIsEditing(false)} 
              style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-muted)', fontWeight: 600 }}
            >
              Hủy bỏ
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="admin-save-btn"
              style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', background: 'var(--admin-accent)', color: '#fff', border: 'none', fontWeight: 600 }}
            >
              {saving ? 'Đang lưu...' : 'Lưu bài viết ✓'}
            </button>
          </div>
        </div>

        {/* Dynamic Split Layout */}
        <div className="admin-editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', minHeight: 'calc(100vh - 200px)' }}>
          {/* Left Form Panel */}
          <div className="admin-editor-form" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Field label="Danh mục bài viết">
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={form.category} 
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)' }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button 
                  type="button" 
                  onClick={() => {
                    const newName = prompt('Nhập tên danh mục mới:');
                    if (newName && newName.trim()) {
                      handleAddCategory(newName.trim());
                    }
                  }}
                  className="admin-add-btn"
                  style={{ whiteSpace: 'nowrap', padding: '0 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  + Danh mục mới
                </button>
              </div>
            </Field>

            <Field label="Tiêu đề bài viết">
              <input 
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                placeholder="Nhập tiêu đề..." 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)', fontSize: '1rem' }}
              />
            </Field>

            <Field label="Mô tả ngắn (hiển thị ở thẻ xem trước)">
              <textarea 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                placeholder="Mô tả ngắn gọn về bài viết..." 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)', minHeight: '60px', resize: 'vertical' }}
              />
            </Field>

            <Field label="Link ảnh đại diện bài viết (URL)">
              <input 
                value={form.imageUrl} 
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} 
                placeholder="https://example.com/image.jpg" 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)' }}
              />
            </Field>

            <Field label="Nội dung bài viết (Soạn thảo mã HTML)">
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--admin-border)', borderRadius: '8px', overflow: 'hidden', marginTop: '6px' }}>
                {/* Editor Toolbar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', background: 'var(--admin-surface2)', borderBottom: '1px solid var(--admin-border)' }}>
                  <button type="button" onClick={() => insertTag('<h1>', '</h1>')} title="H1" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>H1</button>
                  <button type="button" onClick={() => insertTag('<h2>', '</h2>')} title="H2" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>H2</button>
                  <button type="button" onClick={() => insertTag('<h3>', '</h3>')} title="H3" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>H3</button>
                  <button type="button" onClick={() => insertTag('<strong>', '</strong>')} title="B" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)', fontWeight: 'bold' }}>B</button>
                  <button type="button" onClick={() => insertTag('<em>', '</em>')} title="I" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)', fontStyle: 'italic' }}>I</button>
                  <button type="button" onClick={() => insertTag('<p>', '</p>')} title="P" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>P</button>
                  <button type="button" onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>')} title="Danh sách" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>List</button>
                  <button type="button" onClick={triggerImageUpload} title="Tải ảnh lên" style={{ padding: '4px 10px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>🖼️ Tải ảnh từ máy</button>
                </div>
                {/* Textarea */}
                <textarea
                  id="article-content-textarea"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Viết nội dung bài viết bằng HTML ở đây. Ví dụ: <p>Chào bạn...</p>"
                  style={{ width: '100%', minHeight: '380px', padding: '14px', border: 'none', outline: 'none', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6', background: 'var(--admin-surface)', color: 'var(--admin-text)' }}
                />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </Field>
          </div>

          {/* Right Live Preview Panel */}
          <div className="admin-editor-preview" style={{ background: '#fff', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e2035', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              👁️ Giao diện hiển thị thực tế trên Client
            </h3>
            
            <div style={{ flex: 1 }}>
              {/* Preview Header */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ 
                  backgroundColor: '#f8ece6', 
                  color: '#b55139', 
                  padding: '5px 12px', 
                  borderRadius: '20px', 
                  fontSize: '0.78rem', 
                  fontWeight: 700,
                  display: 'inline-block',
                  marginBottom: '10px'
                }}>
                  {form.category || 'Danh mục bài viết'}
                </span>
                <h2 style={{ fontSize: '1.8rem', color: '#1e2035', margin: '0 0 10px 0', fontWeight: 800, lineHeight: 1.3 }}>
                  {form.title || 'Tiêu đề bài viết'}
                </h2>
                <p style={{ color: '#566474', fontStyle: 'italic', margin: 0, fontSize: '0.95rem', lineHeight: 1.45 }}>
                  {form.description || 'Mô tả ngắn của bài viết...'}
                </p>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid rgba(93, 110, 126, 0.12)', margin: '20px 0' }} />

              {/* Preview Body */}
              <div 
                className="article-rich-content"
                dangerouslySetInnerHTML={{ __html: form.content || '<p style="color:#aaa; font-style:italic;">Nội dung bài viết sẽ tự động hiển thị ở đây khi bạn soạn thảo...</p>' }}
                style={{
                  color: '#2d3748',
                  fontSize: '1rem',
                  lineHeight: '1.75'
                }}
              />
            </div>
          </div>
        </div>
        {renderToast()}
      </div>
    );
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2>📝 Bài viết / Kiến thức</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm bài viết</button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Tất cả', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => { setFilterCat(cat); setPage(1); }}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: '1px solid var(--admin-border)',
              background: filterCat === cat ? 'var(--admin-accent)' : 'transparent',
              color: filterCat === cat ? '#fff' : 'var(--admin-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading">Đang tải...</div> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Danh mục</th>
                <th>Tiêu đề</th>
                <th>Mô tả</th>
                <th>Nội dung</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                    )}
                  </td>
                  <td><span className="admin-badge">{item.category}</span></td>
                  <td title={item.title}>{item.title}</td>
                  <td title={item.description}>{item.description}</td>
                  <td>
                    {item.content ? (
                      <span style={{ color: 'var(--admin-accent)', fontWeight: 600 }}>
                        Chi tiết ({item.content.length} ký tự)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--admin-muted)' }}>Chưa soạn thảo</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-action-btns">
                      <button className="admin-edit-btn" onClick={() => openEdit(item)}>Sửa</button>
                      <button className="admin-del-btn" onClick={() => setConfirmId(item.id)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: 24 }}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                width: 30, height: 30, borderRadius: '50%', border: 'none',
                background: page === i + 1 ? 'var(--admin-accent)' : 'var(--admin-surface2)',
                color: page === i + 1 ? '#fff' : 'var(--admin-muted)',
                cursor: 'pointer', fontWeight: 600
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          message="Bài viết này sẽ bị xoá vĩnh viễn."
          onYes={handleDelete}
          onNo={() => setConfirmId(null)}
        />
      )}
      {renderToast()}
    </div>
  );
}
