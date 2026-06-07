import React, { useState } from 'react';
import { useAdminCRUD, ConfirmDialog, AdminModal, Field } from './adminUtils';

const KNOWLEDGE_CATS = [
  'Giáo dục giới tính', 'Tâm sinh lý tuổi dậy thì', 'Tâm lý yêu đương tuổi học trò',
  'Biện pháp tránh thai', 'Chăm sóc cơ thể', 'Tình dục an toàn', 'Bài tập hỗ trợ (xương, hormone)'
];

const empty = () => ({ category: KNOWLEDGE_CATS[0], title: '', description: '' });

export default function ArticlesTab({ token }) {
  const { items, loading, create, update, remove, renderToast, showToast } = useAdminCRUD('articles', token);
  const [modal, setModal] = useState(null); // null | { mode:'add'|'edit', data }
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const openAdd = () => { setForm(empty()); setModal({ mode: 'add' }); };
  const openEdit = (item) => { setForm({ category: item.category, title: item.title, description: item.description }); setModal({ mode: 'edit', id: item.id }); };
  const closeModal = () => setModal(null);

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
    if (modal.mode === 'add') await create(form);
    else await update(modal.id, form);
    setSaving(false);
    setModal(null);
  };

  const handleDelete = async () => {
    await remove(confirmId);
    setConfirmId(null);
  };

  const [filterCat, setFilterCat] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filtered = items.filter(item => filterCat === 'Tất cả' || item.category === filterCat);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="admin-section-header">
        <h2>📝 Bài viết / Kiến thức</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm bài viết</button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Tất cả', ...KNOWLEDGE_CATS].map(cat => (
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
                <th>Danh mục</th>
                <th>Tiêu đề</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td><span className="admin-badge">{item.category}</span></td>
                  <td title={item.title}>{item.title}</td>
                  <td title={item.description}>{item.description}</td>
                  <td>
                    <div className="admin-action-btns">
                      <button className="admin-edit-btn" onClick={() => openEdit(item)}>Sửa</button>
                      <button className="admin-del-btn" onClick={() => setConfirmId(item.id)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: 24 }}>Không có dữ liệu</td></tr>
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

      {modal && (
        <AdminModal
          title={modal.mode === 'add' ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết'}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        >
          <Field label="Danh mục">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {KNOWLEDGE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tiêu đề bài viết">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nhập tiêu đề..." />
          </Field>
          <Field label="Mô tả ngắn">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về bài viết..." />
          </Field>
        </AdminModal>
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
