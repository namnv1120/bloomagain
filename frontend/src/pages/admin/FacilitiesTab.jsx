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
  gmaps: '', rating: 5, note: '',
  imageUrl: '', website: '',
});

export default function FacilitiesTab({ token }) {
  const { items, loading, create, update, remove, renderToast, showToast } = useAdminCRUD('facilities', token);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const fileInputRef = React.useRef(null);

  const openAdd = () => { setForm(emptyForm()); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    const parsed = parseHoursString(item.working_hours);
    setForm({
      name: item.name, address: item.address, phone: item.phone,
      region: item.region, gmaps: item.gmaps || '',
      from: parsed.from, to: parsed.to, days: parsed.days,
      rating: item.rating || 5, note: item.note || '',
      imageUrl: item.imageUrl || '', website: item.website || '',
    });
    setModal({ mode: 'edit', id: item.id });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Vui lòng nhập tên cơ sở y tế!', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      address: form.address,
      phone: form.phone,
      note: form.note,
      region: form.region,
      working_hours: buildHoursString(form.from, form.to, form.days),
      gmaps: form.gmaps,
      svg_type: 'clinic',
      rating: Number(form.rating) || 5,
      imageUrl: form.imageUrl,
      website: form.website,
    };
    if (modal.mode === 'add') await create(payload);
    else await update(modal.id, payload);
    setSaving(false);
    setModal(null);
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
        setForm(f => ({ ...f, imageUrl: data.url }));
        showToast('Tải ảnh lên thành công!', 'success');
      } else {
        showToast('Lỗi tải ảnh lên!', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi tải ảnh lên!', 'error');
    }
    e.target.value = '';
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const [filterRegion, setFilterRegion] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filtered = items.filter(item => filterRegion === 'Tất cả' || item.region === filterRegion);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="admin-section-header">
        <h2>🏥 Cơ sở y tế</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm cơ sở</button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Tất cả', ...REGIONS].map(r => (
          <button
            key={r}
            onClick={() => { setFilterRegion(r); setPage(1); }}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: '1px solid var(--admin-border)',
              background: filterRegion === r ? 'var(--admin-accent)' : 'transparent',
              color: filterRegion === r ? '#fff' : 'var(--admin-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {r}
          </button>
        ))}
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
              {filtered.length === 0 && (
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Tên cơ sở">
                <input value={form.name} onChange={set('name')} placeholder="Tên cơ sở y tế..." />
              </Field>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Địa chỉ">
                <input value={form.address} onChange={set('address')} placeholder="Địa chỉ đầy đủ..." />
              </Field>
            </div>
            
            <Field label="Điện thoại">
              <input value={form.phone} onChange={set('phone')} placeholder="028 xxxx xxxx" />
            </Field>
            <Field label="Khu vực">
              <select value={form.region} onChange={set('region')}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Giờ làm việc">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8 }}>
                  <select value={form.from} onChange={set('from')}>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select value={form.to} onChange={set('to')}>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select value={form.days} onChange={set('days')}>
                    {DAY_RANGES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </Field>
            </div>

            <Field label="Đánh giá (1.0 đến 5.0)">
              <input 
                type="number" 
                step="0.1" 
                min="1" 
                max="5" 
                value={form.rating} 
                onChange={set('rating')} 
                placeholder="Ví dụ: 4.7" 
              />
            </Field>
             <Field label="Link Google Maps">
               <input value={form.gmaps} onChange={set('gmaps')} placeholder="https://maps.google.com/..." />
             </Field>
             <Field label="Website cơ sở y tế (URL)">
               <input value={form.website} onChange={set('website')} placeholder="https://example.com" />
             </Field>
 
             <div style={{ gridColumn: 'span 2' }}>
               <Field label="Ảnh cơ sở y tế (URL) hoặc tải lên">
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://example.com/clinic.jpg" style={{ flex: 1 }} />
                   <button 
                     type="button" 
                     onClick={() => fileInputRef.current?.click()}
                     className="admin-add-btn"
                     style={{ whiteSpace: 'nowrap', padding: '0 12px', height: '42px', borderRadius: '6px', cursor: 'pointer' }}
                   >
                     Tải ảnh từ máy
                   </button>
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

            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Mô tả / Ghi chú">
                <textarea 
                  value={form.note} 
                  onChange={set('note')} 
                  placeholder="Mô tả chi tiết về cơ sở y tế..." 
                  style={{
                    width: '100%', minHeight: 60, padding: '6px 10px', borderRadius: 6,
                    border: '1px solid var(--admin-border)', background: 'var(--admin-surface2)',
                    color: 'var(--admin-text)', resize: 'vertical', fontFamily: 'inherit'
                  }}
                />
              </Field>
            </div>
          </div>
        </AdminModal>
      )}

      {confirmId && (
        <ConfirmDialog
          message="Cơ sở y tế này sẽ bị xoá vĩnh viễn."
          onYes={async () => { await remove(confirmId); setConfirmId(null); }}
          onNo={() => setConfirmId(null)}
        />
      )}
      {renderToast()}
    </div>
  );
}
