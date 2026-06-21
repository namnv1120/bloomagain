import React, { useState, useEffect } from 'react';
import { useAdminCRUD, ConfirmDialog, AdminModal, Field } from './adminUtils';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

const PRODUCT_CATS = ['Sản phẩm chăm sóc cơ thể', 'Sản phẩm giáo dục', 'Sản phẩm tránh thai', 'Sản phẩm vệ sinh'];
const empty = () => ({ category: PRODUCT_CATS[0], name: '', price: '', description: '', link: '', suggested_categories: [] });

export default function ProductsTab({ token }) {
  const { items, loading, create, update, remove, renderToast, showToast } = useAdminCRUD('products', token);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [knowledgeCats, setKnowledgeCats] = useState([]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.ok) {
        setKnowledgeCats(await res.json());
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAdd = () => { setForm(empty()); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    setForm({
      category: item.category,
      name: item.name,
      price: item.price,
      description: item.description || '',
      link: item.link || '',
      suggested_categories: item.suggested_categories || []
    });
    setModal({ mode: 'edit', id: item.id });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Vui lòng nhập tên sản phẩm!', 'error');
      return;
    }
    if (!form.price.trim()) {
      showToast('Vui lòng nhập giá sản phẩm!', 'error');
      return;
    }
    if (!form.description.trim()) {
      showToast('Vui lòng nhập mô tả sản phẩm!', 'error');
      return;
    }
    setSaving(true);
    if (modal.mode === 'add') await create(form);
    else await update(modal.id, form);
    setSaving(false);
    setModal(null);
  };

  const [filterCat, setFilterCat] = useState('Tất cả');
  const [filterSuggest, setFilterSuggest] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filtered = items.filter(item => {
    const matchCat = filterCat === 'Tất cả' || item.category === filterCat;
    let matchSuggest = true;
    if (filterSuggest === 'Chưa có gợi ý') {
      matchSuggest = !item.suggested_categories || item.suggested_categories.length === 0;
    } else if (filterSuggest !== 'Tất cả') {
      matchSuggest = item.suggested_categories && item.suggested_categories.includes(filterSuggest);
    }
    return matchCat && matchSuggest;
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="admin-section-header">
        <h2>🛍️ Sản phẩm</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm sản phẩm</button>
      </div>

      {/* Filter Row 1: Product Classification */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-muted)', minWidth: '100px' }}>Phân loại:</span>
        {['Tất cả', ...PRODUCT_CATS].map(cat => (
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

      {/* Filter Row 2: Suggested Knowledge Categories */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-muted)', minWidth: '100px' }}>Gợi ý bài viết:</span>
        {['Tất cả', 'Chưa có gợi ý', ...knowledgeCats].map(cat => (
          <button
            key={cat}
            onClick={() => { setFilterSuggest(cat); setPage(1); }}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: '1px solid var(--admin-border)',
              background: filterSuggest === cat ? '#3ecf8e33' : 'transparent',
              color: filterSuggest === cat ? '#3ecf8e' : 'var(--admin-muted)',
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
              <tr><th>Danh mục</th><th>Tên sản phẩm</th><th>Giá</th><th>Mô tả</th><th>Gợi ý cho</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td><span className="admin-badge">{item.category}</span></td>
                  <td title={item.name}>{item.name}</td>
                  <td>{item.price}</td>
                  <td title={item.description}>{item.description}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                      {(item.suggested_categories || []).map(c => (
                        <span key={c} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#3ecf8e33', color: '#3ecf8e', fontWeight: 600 }}>
                          {c}
                        </span>
                      ))}
                      {(!item.suggested_categories || item.suggested_categories.length === 0) && (
                        <span style={{ color: 'var(--admin-muted)', fontSize: '0.75rem' }}>-</span>
                      )}
                    </div>
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
          <Field label="Link">
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="#" />
          </Field>
          <Field label="Gợi ý cho danh mục bài viết (kho kiến thức)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', padding: '10px', background: 'var(--admin-surface2)', borderRadius: '8px', marginTop: '6px', border: '1px solid var(--admin-border)' }}>
              {knowledgeCats.map(cat => {
                const checked = (form.suggested_categories || []).includes(cat);
                return (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--admin-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...(form.suggested_categories || []), cat]
                          : (form.suggested_categories || []).filter(c => c !== cat);
                        setForm(f => ({ ...f, suggested_categories: next }));
                      }}
                    />
                    {cat}
                  </label>
                );
              })}
            </div>
          </Field>
        </AdminModal>
      )}

      {confirmId && (
        <ConfirmDialog message="Sản phẩm này sẽ bị xoá vĩnh viễn." onYes={async () => { await remove(confirmId); setConfirmId(null); }} onNo={() => setConfirmId(null)} />
      )}
      {renderToast()}
    </div>
  );
}
