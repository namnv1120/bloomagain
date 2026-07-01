import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

// ─── Generic CRUD helper ──────────────────────────────────────────────────────
export function useAdminCRUD(endpoint, token) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/${endpoint}?t=${Date.now()}`, { headers });
      setItems(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  };

  const create = async (body) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (res.ok) {
        showToast('Thêm mới thành công!', 'success');
        await load();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Thất bại: Lỗi từ máy chủ khi thêm mới.', 'error');
        return false;
      }
    } catch (err) {
      showToast('Thất bại: Lỗi kết nối mạng.', 'error');
      return false;
    }
  };

  const update = async (id, body) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/${endpoint}/${id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (res.ok) {
        showToast('Cập nhật thành công!', 'success');
        await load();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Thất bại: Lỗi từ máy chủ khi cập nhật.', 'error');
        return false;
      }
    } catch (err) {
      showToast('Thất bại: Lỗi kết nối mạng.', 'error');
      return false;
    }
  };

  const remove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/${endpoint}/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        showToast('Xoá thành công!', 'success');
      } else {
        showToast('Thất bại: Lỗi từ máy chủ khi xoá.', 'error');
      }
    } catch (err) {
      showToast('Thất bại: Lỗi kết nối mạng.', 'error');
    }
    await load();
  };

  const renderToast = () => {
    if (!toast) return null;
    return (
      <div className={`admin-toast ${toast.type}`}>
        <span>{toast.message}</span>
        <button className="admin-toast-close" onClick={() => setToast(null)}>×</button>
      </div>
    );
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  return { items, loading, create, update, remove, reload: load, renderToast, showToast };
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ message, onYes, onNo }) {
  return (
    <div className="admin-confirm-overlay">
      <div className="admin-confirm-box">
        <h4>⚠️ Xác nhận xoá</h4>
        <p>{message || 'Bạn có chắc chắn muốn xoá mục này không?'}</p>
        <div className="admin-confirm-btns">
          <button className="admin-confirm-yes" onClick={onYes}>Xoá</button>
          <button className="admin-confirm-no" onClick={onNo}>Huỷ</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
export function AdminModal({ title, onClose, onSave, saving, children }) {
  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-body">{children}</div>
        <div className="admin-modal-footer">
          <button className="admin-cancel-btn" onClick={onClose}>Huỷ</button>
          <button className="admin-save-btn" onClick={onSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu lại ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
