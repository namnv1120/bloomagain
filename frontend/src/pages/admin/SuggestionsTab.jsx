import React, { useState } from 'react';
import { useAdminCRUD, ConfirmDialog, AdminModal, Field } from './adminUtils';

const GENDERS = ['Nam', 'Nữ', 'LGBTQ+'];
const AGES = ['13-17 tuổi', '18-24 tuổi', 'Khác'];
const KNOWLEDGE_CATS = [
  'Giáo dục giới tính', 'Tâm sinh lý tuổi dậy thì', 'Tâm lý yêu đương tuổi học trò',
  'Biện pháp tránh thai', 'Chăm sóc cơ thể', 'Tình dục an toàn', 'Bài tập hỗ trợ (xương, hormone)'
];

const empty = () => ({ gender: GENDERS[0], age: AGES[0], label: '', icon: '💡', category: KNOWLEDGE_CATS[0] });

export default function SuggestionsTab({ token }) {
  const { items, loading, create, update, remove, renderToast, showToast } = useAdminCRUD('suggestions', token);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [filterGender, setFilterGender] = useState('Tất cả');
  const [filterAge, setFilterAge] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const openAdd = () => { setForm(empty()); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    setForm({ gender: item.gender, age: item.age, label: item.label, icon: item.icon, category: item.category });
    setModal({ mode: 'edit', id: item.id });
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      showToast('Vui lòng nhập nhãn gợi ý!', 'error');
      return;
    }
    setSaving(true);
    if (modal.mode === 'add') await create(form);
    else await update(modal.id, form);
    setSaving(false);
    setModal(null);
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const filtered = items.filter(item =>
    (filterGender === 'Tất cả' || item.gender === filterGender) &&
    (filterAge === 'Tất cả' || item.age === filterAge)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="admin-section-header">
        <h2>💡 Gợi ý theo giới tính × độ tuổi</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm gợi ý</button>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Tất cả', ...GENDERS].map(g => (
          <button key={g} onClick={() => { setFilterGender(g); setPage(1); }}
            style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--admin-border)', background: filterGender === g ? 'var(--admin-accent)' : 'transparent', color: filterGender === g ? '#fff' : 'var(--admin-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            {g}
          </button>
        ))}
        <span style={{ color: 'var(--admin-border)', alignSelf: 'center' }}>|</span>
        {['Tất cả', ...AGES].map(a => (
          <button key={a} onClick={() => { setFilterAge(a); setPage(1); }}
            style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--admin-border)', background: filterAge === a ? '#3ecf8e33' : 'transparent', color: filterAge === a ? '#3ecf8e' : 'var(--admin-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            {a}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading">Đang tải...</div> : (
          <table className="admin-table">
            <thead>
              <tr><th>Giới tính</th><th>Độ tuổi</th><th>Icon</th><th>Nhãn gợi ý</th><th>Dẫn đến</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td><span className="admin-badge">{item.gender}</span></td>
                  <td style={{ color: 'var(--admin-muted)', fontSize: '0.8rem' }}>{item.age}</td>
                  <td style={{ fontSize: '1.2rem' }}>{item.icon}</td>
                  <td title={item.label}>{item.label}</td>
                  <td style={{ color: 'var(--admin-accent)', fontSize: '0.8rem' }}>{item.category}</td>
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
        <AdminModal title={modal.mode === 'add' ? 'Thêm gợi ý mới' : 'Chỉnh sửa gợi ý'} onClose={() => setModal(null)} onSave={handleSave} saving={saving}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Giới tính">
              <select value={form.gender} onChange={set('gender')}>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Độ tuổi">
              <select value={form.age} onChange={set('age')}>
                {AGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Nhãn gợi ý (câu hỏi/chủ đề)">
            <input value={form.label} onChange={set('label')} placeholder="VD: Kinh nguyệt lần đầu cần chuẩn bị gì?" />
          </Field>
          <Field label="Icon (emoji)">
            <input value={form.icon} onChange={set('icon')} placeholder="💡" style={{ fontSize: '1.2rem' }} />
          </Field>
          <Field label="Dẫn đến danh mục kiến thức">
            <select value={form.category} onChange={set('category')}>
              {KNOWLEDGE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </AdminModal>
      )}

      {confirmId && (
        <ConfirmDialog message="Gợi ý này sẽ bị xoá." onYes={async () => { await remove(confirmId); setConfirmId(null); }} onNo={() => setConfirmId(null)} />
      )}
      {renderToast()}
    </div>
  );
}
