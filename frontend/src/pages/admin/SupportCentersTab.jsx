import React, { useState } from 'react';
import { useAdminCRUD, ConfirmDialog, AdminModal, Field } from './adminUtils';

const REGIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Khác'];

// Giờ theo bước 30 phút từ 06:00 đến 22:00
const HOURS = Array.from({ length: 32 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
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

const SUPPORT_HOUR_OPTIONS = [
  { label: 'Hỗ trợ 24/7 (Đường dây nóng miễn phí)', value: '24/7' },
  { label: 'Tùy chọn giờ cụ thể', value: 'custom' },
];

function buildHoursString(from, to, days) {
  return `${from} - ${to} (${days})`;
}

function parseHoursString(str) {
  if (!str) return { mode: '24/7', from: '08:00', to: '21:00', days: 'Tất cả các ngày' };
  if (str.includes('24/7')) return { mode: '24/7', from: '08:00', to: '21:00', days: 'Tất cả các ngày' };
  const match = str.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*\((.+)\)$/);
  if (match) return { mode: 'custom', from: match[1], to: match[2], days: match[3] };
  return { mode: '24/7', from: '08:00', to: '21:00', days: 'Tất cả các ngày' };
}

const emptyForm = () => ({
  name: '', address: '', hotline: '', region: REGIONS[0],
  hourMode: '24/7', from: '08:00', to: '21:00', days: 'Tất cả các ngày',
  gmaps: '',
});

export default function SupportCentersTab({ token }) {
  const { items, loading, create, update, remove } = useAdminCRUD('support-centers', token);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const openAdd = () => { setForm(emptyForm()); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    const parsed = parseHoursString(item.working_hours);
    setForm({
      name: item.name, address: item.address, hotline: item.hotline,
      region: item.region, gmaps: item.gmaps || '',
      hourMode: parsed.mode, from: parsed.from, to: parsed.to, days: parsed.days,
    });
    setModal({ mode: 'edit', id: item.id });
  };

  const getWorkingHours = () => {
    if (form.hourMode === '24/7') return 'Hỗ trợ 24/7 (Đường dây nóng miễn phí)';
    return buildHoursString(form.from, form.to, form.days);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.hotline.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name,
      address: form.address,
      hotline: form.hotline,
      region: form.region,
      working_hours: getWorkingHours(),
      gmaps: form.gmaps,
      svg_type: 'shelter',
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
        <h2>🛡️ Trung tâm hỗ trợ</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm trung tâm</button>
      </div>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading">Đang tải...</div> : (
          <table className="admin-table">
            <thead>
              <tr><th>Tên trung tâm</th><th>Khu vực</th><th>Hotline</th><th>Giờ hoạt động</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td title={item.name}>{item.name}</td>
                  <td><span className="admin-badge">{item.region}</span></td>
                  <td style={{ fontWeight: 600, color: '#00b894' }}>{item.hotline}</td>
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
          title={modal.mode === 'add' ? 'Thêm trung tâm bảo trợ' : 'Chỉnh sửa trung tâm'}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        >
          <Field label="Tên trung tâm">
            <input value={form.name} onChange={set('name')} placeholder="Tên trung tâm..." />
          </Field>
          <Field label="Địa chỉ">
            <input value={form.address} onChange={set('address')} placeholder="Địa chỉ đầy đủ..." />
          </Field>
          <Field label="Hotline">
            <input value={form.hotline} onChange={set('hotline')} placeholder="1800 xxxx" />
          </Field>
          <Field label="Khu vực">
            <select value={form.region} onChange={set('region')}>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          {/* Giờ hoạt động */}
          <Field label="Giờ hoạt động">
            <select value={form.hourMode} onChange={set('hourMode')} style={{ marginBottom: 10 }}>
              {SUPPORT_HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {form.hourMode === 'custom' && (
              <>
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
              </>
            )}

            <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--admin-accent)', fontWeight: 600 }}>
              Preview: {getWorkingHours()}
            </div>
          </Field>

          <Field label="Link Google Maps">
            <input value={form.gmaps} onChange={set('gmaps')} placeholder="https://maps.google.com/..." />
          </Field>
        </AdminModal>
      )}

      {confirmId && (
        <ConfirmDialog
          message="Trung tâm bảo trợ này sẽ bị xoá."
          onYes={async () => { await remove(confirmId); setConfirmId(null); }}
          onNo={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
