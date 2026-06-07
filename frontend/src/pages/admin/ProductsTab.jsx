import React, { useState } from 'react';
import { useAdminCRUD, ConfirmDialog, AdminModal, Field } from './adminUtils';

const PRODUCT_CATS = ['Sản phẩm chăm sóc cơ thể', 'Sản phẩm giáo dục', 'Sản phẩm tránh thai', 'Sản phẩm vệ sinh'];
const empty = () => ({ category: PRODUCT_CATS[0], name: '', price: '', description: '', link: '' });

export default function ProductsTab({ token }) {
  const { items, loading, create, update, remove } = useAdminCRUD('products', token);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const openAdd = () => { setForm(empty()); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    setForm({ category: item.category, name: item.name, price: item.price, description: item.description || '', link: item.link || '' });
    setModal({ mode: 'edit', id: item.id });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim() || !form.link.trim()) return;
    setSaving(true);
    if (modal.mode === 'add') await create(form);
    else await update(modal.id, form);
    setSaving(false);
    setModal(null);
  };

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="admin-section-header">
        <h2>🛍️ Sản phẩm</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm sản phẩm</button>
      </div>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading">Đang tải...</div> : (
          <table className="admin-table">
            <thead>
              <tr><th>Danh mục</th><th>Tên sản phẩm</th><th>Giá</th><th>Mô tả</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td><span className="admin-badge">{item.category}</span></td>
                  <td title={item.name}>{item.name}</td>
                  <td>{item.price}</td>
                  <td title={item.description}>{item.description}</td>
                  <td>
                    <div className="admin-action-btns">
                      <button className="admin-edit-btn" onClick={() => openEdit(item)}>Sửa</button>
                      <button className="admin-del-btn" onClick={() => setConfirmId(item.id)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: 24 }}>Không có dữ liệu</td></tr>
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
        <AdminModal title={modal.mode === 'add' ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'} onClose={() => setModal(null)} onSave={handleSave} saving={saving}>
          <Field label="Danh mục">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {PRODUCT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tên sản phẩm">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tên sản phẩm..." />
          </Field>
          <Field label="Giá">
            <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="VD: 129.000đ" />
          </Field>
          <Field label="Mô tả">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn..." />
          </Field>
          <Field label="Link (tuỳ chọn)">
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="#" />
          </Field>
        </AdminModal>
      )}

      {confirmId && (
        <ConfirmDialog message="Sản phẩm này sẽ bị xoá vĩnh viễn." onYes={async () => { await remove(confirmId); setConfirmId(null); }} onNo={() => setConfirmId(null)} />
      )}
    </div>
  );
}
