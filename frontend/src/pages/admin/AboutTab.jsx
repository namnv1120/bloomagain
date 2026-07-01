import React, { useState, useEffect } from 'react';
import { AdminModal, Field } from './adminUtils';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

const DEFAULT_DATA = {
  eyebrow: 'Câu chuyện của chúng tôi',
  heroTitle: 'Về Bloom Again',
  heroSubtitle: 'Chúng tôi tin rằng mọi bạn trẻ đều xứng đáng được tiếp cận kiến thức đúng đắn về giới tính và sức khỏe tâm lý, trong một không gian an toàn, thân thiện và không phán xét.',
  missionTitle: 'Sứ mệnh',
  missionText: 'Cung cấp nền tảng giáo dục giới tính toàn diện.',
  visionTitle: 'Tầm nhìn',
  visionText: 'Xây dựng thế hệ trẻ Việt tự tin, hiểu biết.',
  valuesTitle: 'Giá trị cốt lõi',
  valuesText: 'An toàn, bảo mật, không phán xét.',
  teamSectionTitle: 'Đội ngũ sáng lập',
  teamSectionSubtitle: 'Những người đã xây dựng Bloom Again với tâm huyết vì thế hệ trẻ.',
  teamMembers: [],
  stats: [],
};

export default function AboutTab({ token }) {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // --- Team member modal state ---
  const [memberModal, setMemberModal] = useState(false);
  const [editingMemberIdx, setEditingMemberIdx] = useState(null);
  const [memberForm, setMemberForm] = useState({ name: '', role: '', imageUrl: '', desc: '' });
  const fileInputRef = React.useRef(null);

  // --- Stat modal state ---
  const [statModal, setStatModal] = useState(false);
  const [editingStatIdx, setEditingStatIdx] = useState(null);
  const [statForm, setStatForm] = useState({ num: '', label: '' });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/about-page`, { headers })
      .then(r => r.json())
      .then(d => { setData({ ...DEFAULT_DATA, ...d }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/about-page`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showToast('Đã lưu nội dung trang Về chúng tôi!', 'success');
      } else {
        showToast('Lưu thất bại. Vui lòng thử lại.', 'error');
      }
    } catch {
      showToast('Lỗi kết nối mạng.', 'error');
    }
    setSaving(false);
  };

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  // ─── Team Members ────────────────────────────────────────────────────────
  const openAddMember = () => {
    setMemberForm({ name: '', role: '', imageUrl: '', desc: '' });
    setEditingMemberIdx(null);
    setMemberModal(true);
  };
  const openEditMember = (idx) => {
    setMemberForm({ ...data.teamMembers[idx] });
    setEditingMemberIdx(idx);
    setMemberModal(true);
  };
  const saveMember = () => {
    if (!memberForm.name.trim() || !memberForm.role.trim()) {
      showToast('Vui lòng nhập đầy đủ Tên và Chức danh!', 'error');
      return;
    }
    const members = [...(data.teamMembers || [])];
    if (editingMemberIdx !== null) {
      members[editingMemberIdx] = memberForm;
    } else {
      members.push(memberForm);
    }
    set('teamMembers', members);
    setMemberModal(false);
  };
  const deleteMember = (idx) => {
    const members = [...(data.teamMembers || [])];
    members.splice(idx, 1);
    set('teamMembers', members);
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
        setMemberForm(f => ({ ...f, imageUrl: data.url }));
        showToast('Tải ảnh lên thành công!', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Lỗi tải ảnh lên!', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi tải ảnh lên!', 'error');
    }
    e.target.value = '';
  };

  // ─── Stats ───────────────────────────────────────────────────────────────
  const openAddStat = () => {
    setStatForm({ num: '', label: '' });
    setEditingStatIdx(null);
    setStatModal(true);
  };
  const openEditStat = (idx) => {
    setStatForm({ ...data.stats[idx] });
    setEditingStatIdx(idx);
    setStatModal(true);
  };
  const saveStat = () => {
    if (!statForm.num.trim() || !statForm.label.trim()) {
      showToast('Vui lòng nhập đầy đủ Số/Giá trị và Nhãn mô tả!', 'error');
      return;
    }
    const stats = [...(data.stats || [])];
    if (editingStatIdx !== null) {
      stats[editingStatIdx] = statForm;
    } else {
      stats.push(statForm);
    }
    set('stats', stats);
    setStatModal(false);
  };
  const deleteStat = (idx) => {
    const stats = [...(data.stats || [])];
    stats.splice(idx, 1);
    set('stats', stats);
  };

  if (loading) return <div className="admin-loading">Đang tải nội dung trang Về chúng tôi...</div>;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button className="admin-toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <div className="admin-section-header">
        <h2>🌸 Trang Về chúng tôi</h2>
        <button className="admin-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
        </button>
      </div>

      {/* ─── HERO SECTION ─────────────────────────────────────────────── */}
      <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          🎯 Phần Hero (Đầu trang)
        </h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <Field label="Nhãn phụ (eyebrow)">
            <input className="admin-input" value={data.eyebrow || ''} onChange={e => set('eyebrow', e.target.value)} placeholder="VD: Câu chuyện của chúng tôi" />
          </Field>
          <Field label="Tiêu đề chính (heroTitle)">
            <input className="admin-input" value={data.heroTitle || ''} onChange={e => set('heroTitle', e.target.value)} placeholder="VD: Về Bloom Again" />
          </Field>
          <Field label="Mô tả (heroSubtitle)">
            <textarea className="admin-textarea" rows={3} value={data.heroSubtitle || ''} onChange={e => set('heroSubtitle', e.target.value)} placeholder="Mô tả ngắn về Bloom Again..." />
          </Field>
        </div>
      </div>

      {/* ─── MISSION / VISION / VALUES ─────────────────────────────────── */}
      <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          📋 Sứ mệnh / Tầm nhìn / Giá trị
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* Mission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Tiêu đề Sứ mệnh">
              <input className="admin-input" value={data.missionTitle || ''} onChange={e => set('missionTitle', e.target.value)} />
            </Field>
            <Field label="Nội dung Sứ mệnh">
              <textarea className="admin-textarea" rows={4} value={data.missionText || ''} onChange={e => set('missionText', e.target.value)} />
            </Field>
          </div>
          {/* Vision */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Tiêu đề Tầm nhìn">
              <input className="admin-input" value={data.visionTitle || ''} onChange={e => set('visionTitle', e.target.value)} />
            </Field>
            <Field label="Nội dung Tầm nhìn">
              <textarea className="admin-textarea" rows={4} value={data.visionText || ''} onChange={e => set('visionText', e.target.value)} />
            </Field>
          </div>
          {/* Values */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Tiêu đề Giá trị">
              <input className="admin-input" value={data.valuesTitle || ''} onChange={e => set('valuesTitle', e.target.value)} />
            </Field>
            <Field label="Nội dung Giá trị">
              <textarea className="admin-textarea" rows={4} value={data.valuesText || ''} onChange={e => set('valuesText', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      {/* ─── TEAM MEMBERS ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div className="admin-section-header" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            👥 Đội ngũ sáng lập
          </h3>
          <button className="admin-add-btn" onClick={openAddMember}>+ Thêm thành viên</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Field label="Tiêu đề mục đội ngũ">
            <input className="admin-input" value={data.teamSectionTitle || ''} onChange={e => set('teamSectionTitle', e.target.value)} />
          </Field>
          <Field label="Mô tả mục đội ngũ">
            <input className="admin-input" value={data.teamSectionSubtitle || ''} onChange={e => set('teamSectionSubtitle', e.target.value)} />
          </Field>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên</th>
                <th>Chức danh</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(data.teamMembers || []).map((m, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center' }}>
                    {m.imageUrl ? (
                      <img 
                        src={m.imageUrl.startsWith('http') ? m.imageUrl : API_BASE + m.imageUrl} 
                        alt={m.name} 
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'inline-block' }} />
                    )}
                  </td>
                  <td><strong>{m.name}</strong></td>
                  <td><span className="admin-badge">{m.role}</span></td>
                  <td style={{ maxWidth: 200, fontSize: '0.82rem', color: 'var(--admin-muted)' }}>{m.desc}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-edit-btn" onClick={() => openEditMember(idx)}>Sửa</button>
                      <button className="admin-delete-btn" onClick={() => deleteMember(idx)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data.teamMembers || data.teamMembers.length === 0) && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-muted)' }}>Chưa có thành viên nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div className="admin-section-header" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            📊 Số liệu thống kê (Stats)
          </h3>
          <button className="admin-add-btn" onClick={openAddStat}>+ Thêm chỉ số</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Số / Giá trị</th>
                <th>Nhãn mô tả</th>
                <th style={{ width: '150px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(data.stats || []).map((s, idx) => (
                <tr key={idx}>
                  <td><strong style={{ fontSize: '1.1rem', color: 'var(--admin-accent)' }}>{s.num}</strong></td>
                  <td>{s.label}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-edit-btn" onClick={() => openEditStat(idx)}>Sửa</button>
                      <button className="admin-delete-btn" onClick={() => deleteStat(idx)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data.stats || data.stats.length === 0) && (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-muted)' }}>Chưa có chỉ số nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MEMBER MODAL ─────────────────────────────────────────────── */}
      {memberModal && (
        <AdminModal
          title={editingMemberIdx !== null ? 'Sửa thành viên' : 'Thêm thành viên mới'}
          onClose={() => setMemberModal(false)}
          onSave={saveMember}
          saving={false}
        >
          <Field label="Ảnh (Tải lên)">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {memberForm.imageUrl && (
                <img 
                  src={memberForm.imageUrl.startsWith('http') ? memberForm.imageUrl : API_BASE + memberForm.imageUrl} 
                  alt="Preview" 
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} 
                />
              )}
              <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} />
              <button type="button" className="admin-save-btn" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => fileInputRef.current?.click()}>
                Tải ảnh từ máy
              </button>
            </div>
            <input className="admin-input" style={{ marginTop: 8 }} value={memberForm.imageUrl || ''} onChange={e => setMemberForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="Hoặc dán link ảnh vào đây..." />
          </Field>
          <Field label="Tên *">
            <input className="admin-input" value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Minh Anh" />
          </Field>
          <Field label="Chức danh *">
            <input className="admin-input" value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))} placeholder="Nhà sáng lập & Giám đốc điều hành" />
          </Field>
          <Field label="Mô tả">
            <textarea className="admin-textarea" rows={3} value={memberForm.desc} onChange={e => setMemberForm(f => ({ ...f, desc: e.target.value }))} placeholder="Mô tả ngắn về thành viên..." />
          </Field>
        </AdminModal>
      )}

      {/* ─── STAT MODAL ───────────────────────────────────────────────── */}
      {statModal && (
        <AdminModal
          title={editingStatIdx !== null ? 'Sửa chỉ số' : 'Thêm chỉ số mới'}
          onClose={() => setStatModal(false)}
          onSave={saveStat}
          saving={false}
        >
          <Field label="Số / Giá trị *">
            <input className="admin-input" value={statForm.num} onChange={e => setStatForm(f => ({ ...f, num: e.target.value }))} placeholder="VD: 10,000+ hoặc 24/7 hoặc 100%" />
          </Field>
          <Field label="Nhãn mô tả *">
            <input className="admin-input" value={statForm.label} onChange={e => setStatForm(f => ({ ...f, label: e.target.value }))} placeholder="VD: Người dùng tin tưởng" />
          </Field>
        </AdminModal>
      )}
    </div>
  );
}
