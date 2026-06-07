import React, { useState } from 'react';
import { useAdminCRUD, ConfirmDialog, AdminModal, Field } from './adminUtils';

const REGIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Khác'];

// Tạo danh sách giờ theo bước 30 phút
const HOURS = Array.from({ length: 32 }, (_, i) => {
  const h = Math.floor(i / 2) + 6; // 06:00 -> 21:30
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const DAY_RANGES = [
  'Thứ 2 - Thứ Sáu',
  'Thứ 2 - Thứ Bảy',
  'Thứ 2 - Chủ Nhật',
  'Tất cả các ngày',
  'Thứ 7 & Chủ Nhật',
];

// Tạo working_hours string từ các lựa chọn
function buildHoursString(from, to, days) {
  return `${from} - ${to} (${days})`;
}

// Parse working_hours string ngược lại (nếu có thể)
function parseHoursString(str) {
  // "08:00 - 18:00 (Thứ 2 - Thứ Bảy)"
  const match = str?.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*\((.+)\)$/);
  if (match) return { from: match[1], to: match[2], days: match[3] };
  return { from: '08:00', to: '18:00', days: 'Thứ 2 - Thứ Bảy' };
}

const emptyForm = () => ({
  name: '', address: '', phone: '', region: REGIONS[0],
  from: '08:00', to: '18:00', days: 'Thứ 2 - Thứ Bảy',
  gmaps: '',
});

export default function FacilitiesTab({ token }) {
  const { items, loading, create, update, remove } = useAdminCRUD('facilities', token);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const openAdd = () => { setForm(emptyForm()); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    const parsed = parseHoursString(item.working_hours);
    setForm({
      name: item.name, address: item.address, phone: item.phone,
      region: item.region, gmaps: item.gmaps || '',
      from: parsed.from, to: parsed.to, days: parsed.days,
    });
    setModal({ mode: 'edit', id: item.id });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name,
      address: form.address,
      phone: form.phone,
      note: '',
      region: form.region,
      working_hours: buildHoursString(form.from, form.to, form.days),
      gmaps: form.gmaps,
      svg_type: 'clinic',
    };
    if (modal.mode === 'add') await create(payload);
    else await update(modal.id, payload);
    setSaving(false);
    setModal(null);
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="admin-section-header">
        <h2>🏥 Cơ sở y tế</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm cơ sở</button>
      </div>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading">Đang tải...</div> : (
          <table className="admin-table">
            <thead>
              <tr><th>Tên</th><th>Khu vực</th><th>Điện thoại</th><th>Giờ làm việc</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td title={item.name}>{item.name}</td>
                  <td><span className="admin-badge">{item.region}</span></td>
                  <td>{item.phone}</td>
                  <td title={item.working_hours} style={{ color: 'var(--admin-muted)', fontSize: '0.82rem' }}>{item.working_hours}</td>
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
        <AdminModal
          title={modal.mode === 'add' ? 'Thêm cơ sở y tế' : 'Chỉnh sửa cơ sở y tế'}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        >
          <Field label="Tên cơ sở">
            <input value={form.name} onChange={set('name')} placeholder="Tên cơ sở y tế..." />
          </Field>
          <Field label="Địa chỉ">
            <input value={form.address} onChange={set('address')} placeholder="Địa chỉ đầy đủ..." />
          </Field>
          <Field label="Điện thoại">
            <input value={form.phone} onChange={set('phone')} placeholder="028 xxxx xxxx" />
          </Field>
          <Field label="Khu vực">
            <select value={form.region} onChange={set('region')}>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          {/* Giờ làm việc — chọn từ/đến + ngày */}
          <Field label="Giờ làm việc">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--admin-muted)', display: 'block', marginBottom: 4 }}>Từ giờ</label>
                <select value={form.from} onChange={set('from')}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--admin-muted)', display: 'block', marginBottom: 4 }}>Đến giờ</label>
                <select value={form.to} onChange={set('to')}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <select value={form.days} onChange={set('days')}>
              {DAY_RANGES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--admin-accent)', fontWeight: 600 }}>
              Preview: {buildHoursString(form.from, form.to, form.days)}
            </div>
          </Field>

          <Field label="Link Google Maps">
            <input value={form.gmaps} onChange={set('gmaps')} placeholder="https://maps.google.com/..." />
          </Field>
        </AdminModal>
      )}

      {confirmId && (
        <ConfirmDialog
          message="Cơ sở y tế này sẽ bị xoá vĩnh viễn."
          onYes={async () => { await remove(confirmId); setConfirmId(null); }}
          onNo={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
