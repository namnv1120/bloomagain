import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminCRUD, ConfirmDialog, Field } from './adminUtils';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

const empty = (cat = '') => ({ category: cat, title: '', description: '', imageUrl: '', link: '', content: '', isLatest: false });

// ─── Rich Text Editor Component ──────────────────────────────────────────────
function RichEditor({ value, onChange, token, showToast }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const [activeFormats, setActiveFormats] = useState({});
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const savedRangeRef = useRef(null);

  // Sync external value → editor (only on mount or external programmatic change)
  const lastValueRef = useRef(value);
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      editorRef.current.innerHTML = value;
      lastValueRef.current = value;
    }
  }, [value]);

  const syncToParent = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
  }, [onChange]);

  const updateActiveFormats = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
      });
    } catch { }
  }, []);

  const exec = useCallback((command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncToParent();
    updateActiveFormats();
  }, [syncToParent, updateActiveFormats]);

  const insertBlock = useCallback((tag, className = '') => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString() || 'Nhập nội dung ở đây';
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = selectedText;
    range.deleteContents();
    range.insertNode(el);
    // Move cursor after the inserted block
    const newRange = document.createRange();
    newRange.setStartAfter(el);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    syncToParent();
  }, [syncToParent]);

  const insertHorizontalRule = useCallback(() => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:2px solid #e2e6f0;margin:24px 0;" />');
    syncToParent();
  }, [syncToParent]);

  const insertBlockquote = useCallback(() => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString() || 'Trích dẫn nội dung...';
    document.execCommand('insertHTML', false,
      `<blockquote style="border-left:4px solid #6c5ce7;margin:16px 0;padding:12px 20px;background:#f8f7ff;border-radius:0 8px 8px 0;color:#4a4569;font-style:italic;">${selectedText}</blockquote>`
    );
    syncToParent();
  }, [syncToParent]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const openLinkDialog = () => {
    saveSelection();
    const sel = window.getSelection();
    setLinkText(sel?.toString() || '');
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const insertLink = () => {
    editorRef.current?.focus();
    restoreSelection();
    if (linkUrl) {
      const html = `<a href="${linkUrl}" target="_blank" rel="noopener" style="color:#6c5ce7;text-decoration:underline;">${linkText || linkUrl}</a>`;
      document.execCommand('insertHTML', false, html);
      syncToParent();
    }
    setLinkDialogOpen(false);
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
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        editorRef.current?.focus();
        document.execCommand('insertHTML', false,
          `<img src="${data.url}" alt="Hình ảnh" style="max-width:100%;height:auto;border-radius:10px;margin:16px 0;display:block;" />`
        );
        syncToParent();
        showToast('Tải ảnh thành công!', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Lỗi tải ảnh lên!', 'error');
      }
    } catch {
      showToast('Lỗi kết nối!', 'error');
    }
    e.target.value = '';
  };

  const setFontSize = (size) => {
    editorRef.current?.focus();
    document.execCommand('fontSize', false, '7');
    const els = editorRef.current.querySelectorAll('font[size="7"]');
    els.forEach(el => {
      el.removeAttribute('size');
      el.style.fontSize = size;
    });
    syncToParent();
  };

  const setTextColor = (color) => exec('foreColor', color);
  const setHighlightColor = (color) => exec('hiliteColor', color);

  const applyHeading = (tag) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    syncToParent();
    updateActiveFormats();
  };

  const btnStyle = (active = false) => ({
    padding: '5px 9px',
    borderRadius: 5,
    cursor: 'pointer',
    border: active ? '1.5px solid var(--admin-accent)' : '1px solid var(--admin-border)',
    background: active ? 'var(--admin-accent-light)' : 'var(--admin-surface)',
    color: active ? 'var(--admin-accent)' : 'var(--admin-text)',
    fontSize: '0.82rem',
    fontWeight: 600,
    lineHeight: 1.4,
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap'
  });

  const divider = <div style={{ width: 1, height: 24, background: 'var(--admin-border)', margin: '0 4px', flexShrink: 0 }} />;

  return (
    <div style={{ border: '1px solid var(--admin-border)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar — 2 hàng */}
      <div style={{
        background: 'var(--admin-surface2)',
        borderBottom: '1px solid var(--admin-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0
      }}>


        {/* ── Hàng 1: Kiểu chữ, định dạng, màu, căn chỉnh ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', padding: '7px 10px', borderBottom: '1px solid var(--admin-border)' }}>

          {/* Heading style select */}
          <select
            onChange={e => applyHeading(e.target.value)}
            defaultValue=""
            style={{
              padding: '5px 8px', borderRadius: 5, fontSize: '0.82rem', fontWeight: 600,
              border: '1px solid var(--admin-border)', background: 'var(--admin-surface)',
              color: 'var(--admin-text)', cursor: 'pointer', height: 32
            }}
          >
            <option value="" disabled>Kiểu văn bản</option>
            <option value="p">📄 Đoạn văn</option>
            <option value="h1">H1 — Tiêu đề chính</option>
            <option value="h2">H2 — Tiêu đề lớn</option>
            <option value="h3">H3 — Tiêu đề phụ</option>
            <option value="h4">H4 — Tiêu đề nhỏ</option>
          </select>

          {/* Font size */}
          <select
            onChange={e => setFontSize(e.target.value)}
            defaultValue=""
            style={{
              padding: '5px 8px', borderRadius: 5, fontSize: '0.82rem', fontWeight: 600,
              border: '1px solid var(--admin-border)', background: 'var(--admin-surface)',
              color: 'var(--admin-text)', cursor: 'pointer', height: 32, width: 72
            }}
          >
            <option value="" disabled>Cỡ chữ</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="28px">28</option>
            <option value="32px">32</option>
          </select>

          {divider}

          {/* Basic formatting */}
          <button type="button" onClick={() => exec('bold')} style={btnStyle(activeFormats.bold)} title="In đậm (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button type="button" onClick={() => exec('italic')} style={btnStyle(activeFormats.italic)} title="In nghiêng (Ctrl+I)">
            <em>I</em>
          </button>
          <button type="button" onClick={() => exec('underline')} style={btnStyle(activeFormats.underline)} title="Gạch chân (Ctrl+U)">
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>
          <button type="button" onClick={() => exec('strikeThrough')} style={btnStyle(activeFormats.strikeThrough)} title="Gạch ngang">
            <span style={{ textDecoration: 'line-through' }}>S</span>
          </button>
          <button type="button" onClick={() => exec('superscript')} style={btnStyle()} title="Chữ trên">
            x<sup style={{ fontSize: '0.6em' }}>2</sup>
          </button>
          <button type="button" onClick={() => exec('subscript')} style={btnStyle()} title="Chữ dưới">
            x<sub style={{ fontSize: '0.6em' }}>2</sub>
          </button>

          {divider}

          {/* Text color — height cố định để thẳng hàng */}
          <label title="Màu chữ" style={{ ...btnStyle(), marginTop: 5, height: 32, padding: '0 8px', cursor: 'pointer', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>A</span>
            <input type="color" defaultValue="#1a1d2e" onChange={e => setTextColor(e.target.value)}
              style={{ width: 16, height: 16, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 2, flexShrink: 0 }} />
          </label>

          {/* Highlight color */}
          <label title="Màu nền / tô sáng" style={{ ...btnStyle(), marginTop: 5, height: 32, padding: '0 8px', cursor: 'pointer', boxSizing: 'border-box' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" style={{ opacity: 0.8 }}>
              <path d="M13.5 1.5a1.5 1.5 0 00-2.12 0L4.5 8.38l-.38 2.5 2.5-.38 6.88-6.88a1.5 1.5 0 000-2.12zM3 11.5l-1 3 3-1-2-2z" />
            </svg>
            <input type="color" defaultValue="#fffb00" onChange={e => setHighlightColor(e.target.value)}
              style={{ width: 16, height: 16, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 2, flexShrink: 0 }} />
          </label>

          {divider}

          {/* Alignment */}
          <button type="button" onClick={() => exec('justifyLeft')} style={btnStyle(activeFormats.justifyLeft)} title="Căn trái">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" rx="1" />
              <rect x="1" y="6" width="9" height="2" rx="1" />
              <rect x="1" y="10" width="12" height="2" rx="1" />
              <rect x="1" y="14" width="7" height="2" rx="1" />
            </svg>
          </button>
          <button type="button" onClick={() => exec('justifyCenter')} style={btnStyle(activeFormats.justifyCenter)} title="Căn giữa">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" rx="1" />
              <rect x="3.5" y="6" width="9" height="2" rx="1" />
              <rect x="2" y="10" width="12" height="2" rx="1" />
              <rect x="4.5" y="14" width="7" height="2" rx="1" />
            </svg>
          </button>
          <button type="button" onClick={() => exec('justifyRight')} style={btnStyle(activeFormats.justifyRight)} title="Căn phải">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" rx="1" />
              <rect x="6" y="6" width="9" height="2" rx="1" />
              <rect x="3" y="10" width="12" height="2" rx="1" />
              <rect x="8" y="14" width="7" height="2" rx="1" />
            </svg>
          </button>
          <button type="button" onClick={() => exec('justifyFull')} style={btnStyle(activeFormats.justifyFull)} title="Căn đều 2 bên">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" rx="1" />
              <rect x="1" y="6" width="14" height="2" rx="1" />
              <rect x="1" y="10" width="14" height="2" rx="1" />
              <rect x="1" y="14" width="14" height="2" rx="1" />
            </svg>
          </button>
        </div>

        {/* ── Hàng 2: Danh sách, thụt lề, chèn đặc biệt ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', padding: '7px 10px' }}>

          {/* Lists & Indent — icon only */}
          <button type="button" onClick={() => exec('insertUnorderedList')} style={btnStyle(activeFormats.insertUnorderedList)} title="Danh sách dấu chấm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="2" cy="4" r="1.5" />
              <rect x="5" y="3" width="10" height="2" rx="1" />
              <circle cx="2" cy="8" r="1.5" />
              <rect x="5" y="7" width="10" height="2" rx="1" />
              <circle cx="2" cy="12" r="1.5" />
              <rect x="5" y="11" width="10" height="2" rx="1" />
            </svg>
          </button>
          <button type="button" onClick={() => exec('insertOrderedList')} style={btnStyle(activeFormats.insertOrderedList)} title="Danh sách đánh số">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <text x="0.5" y="5.5" fontSize="5" fontWeight="bold" fontFamily="sans-serif">1.</text>
              <rect x="5" y="3" width="10" height="2" rx="1" />
              <text x="0.5" y="9.5" fontSize="5" fontWeight="bold" fontFamily="sans-serif">2.</text>
              <rect x="5" y="7" width="10" height="2" rx="1" />
              <text x="0.5" y="13.5" fontSize="5" fontWeight="bold" fontFamily="sans-serif">3.</text>
              <rect x="5" y="11" width="10" height="2" rx="1" />
            </svg>
          </button>

          {divider}

          <button type="button" onClick={() => exec('indent')} style={btnStyle()} title="Thụt vào">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" rx="1" />
              <rect x="5" y="6" width="10" height="2" rx="1" />
              <rect x="5" y="10" width="10" height="2" rx="1" />
              <rect x="1" y="14" width="14" height="2" rx="1" />
              <path d="M1 7.5l3 1.5-3 1.5V7.5z" />
            </svg>
          </button>
          <button type="button" onClick={() => exec('outdent')} style={btnStyle()} title="Bỏ thụt">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" rx="1" />
              <rect x="5" y="6" width="10" height="2" rx="1" />
              <rect x="5" y="10" width="10" height="2" rx="1" />
              <rect x="1" y="14" width="14" height="2" rx="1" />
              <path d="M4 7.5l-3 1.5 3 1.5V7.5z" />
            </svg>
          </button>

          {divider}

          {/* Special inserts */}
          <button type="button" onClick={insertBlockquote} style={btnStyle()} title="Trích dẫn">
            ❝ Trích dẫn
          </button>
          <button type="button" onClick={insertHorizontalRule} style={btnStyle()} title="Đường kẻ ngang">
            — Kẻ ngang
          </button>
          <button type="button" onClick={openLinkDialog} style={btnStyle()} title="Chèn liên kết">
            🔗 Liên kết
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={btnStyle()} title="Chèn ảnh vào nội dung">
            🖼️ Chèn ảnh
          </button>
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        </div>

      </div>

      {/* Editor area */}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncToParent}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onFocus={updateActiveFormats}
        style={{
          minHeight: 400,
          padding: '20px 24px',
          outline: 'none',
          fontSize: '0.97rem',
          lineHeight: 1.8,
          color: 'var(--admin-text)',
          background: 'var(--admin-surface)',
          overflowY: 'auto'
        }}
        dangerouslySetInnerHTML={undefined}
      />

      {/* Link Dialog */}
      {linkDialogOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
            borderRadius: 12, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h4 style={{ margin: '0 0 18px 0', fontSize: '1rem' }}>🔗 Chèn liên kết</h4>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Văn bản hiển thị</label>
              <input
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                placeholder="Ví dụ: Xem thêm tại đây"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1.5px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Địa chỉ URL</label>
              <input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1.5px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                onKeyDown={e => e.key === 'Enter' && insertLink()}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setLinkDialogOpen(false)}
                style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-muted)', cursor: 'pointer', fontWeight: 600 }}>
                Huỷ
              </button>
              <button type="button" onClick={insertLink}
                style={{ padding: '8px 22px', borderRadius: 7, border: 'none', background: 'var(--admin-accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Chèn liên kết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cover Image Upload Component ────────────────────────────────────────────
function CoverImageField({ imageUrl, onChange, token, showToast }) {
  const [mode, setMode] = useState(imageUrl && !imageUrl.startsWith('blob') ? 'url' : 'upload');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      showToast('Đang tải ảnh lên...', 'info');
      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
        showToast('Tải ảnh thành công!', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Lỗi tải ảnh!', 'error');
      }
    } catch {
      showToast('Lỗi kết nối!', 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) uploadFile(file);
  };

  const tabStyle = (active) => ({
    padding: '7px 18px',
    borderRadius: '7px 7px 0 0',
    border: '1px solid var(--admin-border)',
    borderBottom: active ? '1px solid var(--admin-surface)' : '1px solid var(--admin-border)',
    background: active ? 'var(--admin-surface)' : 'var(--admin-surface2)',
    color: active ? 'var(--admin-accent)' : 'var(--admin-muted)',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    marginBottom: -1,
    position: 'relative',
    zIndex: active ? 2 : 1
  });

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 0 }}>
        <button type="button" onClick={() => setMode('upload')} style={tabStyle(mode === 'upload')}>
          📁 Tải ảnh lên từ máy
        </button>
        <button type="button" onClick={() => setMode('url')} style={tabStyle(mode === 'url')}>
          🔗 Nhập URL ảnh
        </button>
      </div>

      <div style={{ border: '1px solid var(--admin-border)', borderRadius: '0 8px 8px 8px', background: 'var(--admin-surface)', padding: 16, position: 'relative', zIndex: 1 }}>
        {mode === 'upload' ? (
          <div>
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragging ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                borderRadius: 10,
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'var(--admin-accent-light)' : 'var(--admin-surface2)',
                transition: 'all 0.2s',
                marginBottom: imageUrl ? 14 : 0
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🖼️</div>
              <p style={{ margin: 0, color: 'var(--admin-muted)', fontSize: '0.88rem' }}>
                <strong style={{ color: 'var(--admin-accent)' }}>Nhấp để chọn</strong> hoặc kéo thả ảnh vào đây
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--admin-muted)', fontSize: '0.78rem' }}>
                PNG, JPG, WEBP — tối đa 5MB
              </p>
            </div>
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }}
              onChange={e => uploadFile(e.target.files?.[0])} />
          </div>
        ) : (
          <input
            value={imageUrl}
            onChange={e => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 7,
              border: '1.5px solid var(--admin-border)', background: 'var(--admin-surface2)',
              color: 'var(--admin-text)', fontSize: '0.9rem', boxSizing: 'border-box'
            }}
          />
        )}

        {/* Preview */}
        {imageUrl && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={imageUrl}
              alt="Preview"
              style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--admin-border)' }}
              onError={e => e.target.style.display = 'none'}
            />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-success)', fontWeight: 600 }}>✓ Ảnh đại diện đã được chọn</p>
              <p style={{ margin: '3px 0 8px', fontSize: '0.75rem', color: 'var(--admin-muted)', wordBreak: 'break-all' }}>{imageUrl.length > 60 ? imageUrl.slice(0, 57) + '...' : imageUrl}</p>
              <button type="button" onClick={() => onChange('')}
                style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--admin-danger)', background: 'var(--admin-danger-light)', color: 'var(--admin-danger)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                × Xoá ảnh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ArticlesTab({ token }) {
  const { items, loading, create, update, remove, renderToast, showToast } = useAdminCRUD('articles', token);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (err) { console.error('Failed to load categories', err); }
  };

  useEffect(() => { loadCategories(); }, []);

  const openAdd = () => { setForm(empty(categories[0] || '')); setEditId(null); setIsEditing(true); };
  const openEdit = (item) => {
    setForm({ category: item.category, title: item.title, description: item.description, imageUrl: item.imageUrl || '', link: item.link || '', content: item.content || '', isLatest: item.isLatest || false });
    setEditId(item.id);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Vui lòng nhập tiêu đề bài viết!', 'error'); return; }
    if (!form.description.trim()) { showToast('Vui lòng nhập mô tả bài viết!', 'error'); return; }
    setSaving(true);
    let success = false;
    if (!editId) success = await create(form);
    else success = await update(editId, form);
    setSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => { await remove(confirmId); setConfirmId(null); };

  const handleAddCategory = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
    } catch { showToast('Lỗi kết nối mạng', 'error'); }
  };

  const filtered = items.filter(item => filterCat === 'Tất cả' || item.category === filterCat);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (isEditing) {
    return (
      <div className="admin-editor-view" style={{ padding: '8px' }}>
        {/* Editor Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setIsEditing(false)} className="admin-edit-btn"
              style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'var(--admin-surface2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontWeight: 600 }}>
              ← Quay lại danh sách
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
              {editId ? '📝 Chỉnh sửa bài viết' : '✨ Thêm bài viết mới'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsEditing(false)}
              style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-muted)', fontWeight: 600 }}>
              Hủy bỏ
            </button>
            <button onClick={handleSave} disabled={saving} className="admin-save-btn"
              style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', background: 'var(--admin-accent)', color: '#fff', border: 'none', fontWeight: 600 }}>
              {saving ? 'Đang lưu...' : '✓ Lưu bài viết'}
            </button>
          </div>
        </div>

        {/* Split Layout */}
        <div className="admin-editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', minHeight: 'calc(100vh - 200px)' }}>
          {/* Left Form */}
          <div className="admin-editor-form" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>

            <Field label="Danh mục bài viết">
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)' }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => {
                  const newName = prompt('Nhập tên danh mục mới:');
                  if (newName?.trim()) handleAddCategory(newName.trim());
                }} className="admin-add-btn" style={{ whiteSpace: 'nowrap', padding: '0 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  + Danh mục mới
                </button>
              </div>
            </Field>

            <Field label="Tiêu đề bài viết">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nhập tiêu đề..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)', fontSize: '1rem', boxSizing: 'border-box' }} />
            </Field>

            <Field label="Mô tả ngắn (hiển thị ở thẻ xem trước)">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn gọn về bài viết..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface2)', color: 'var(--admin-text)', minHeight: '70px', resize: 'vertical', boxSizing: 'border-box' }} />
            </Field>

            <Field label="Ảnh đại diện bài viết">
              <CoverImageField
                imageUrl={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
                token={token}
                showToast={showToast}
              />
            </Field>

            <Field label="Cấu hình hiển thị">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--admin-text)', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.isLatest || false}
                  onChange={e => setForm(f => ({ ...f, isLatest: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  Đánh dấu là "Bài viết mới nhất" ở đầu trang người dùng (Tối đa 3 bài)
                </span>
              </label>
            </Field>

            <Field label="Nội dung bài viết">
              <RichEditor
                value={form.content}
                onChange={content => setForm(f => ({ ...f, content }))}
                token={token}
                showToast={showToast}
              />
            </Field>
          </div>

          {/* Right Preview */}
          <div className="admin-editor-preview" style={{ background: '#fff', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'sticky', top: 0 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e2035', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              👁️ Xem trước — giao diện hiển thị thực tế
            </h3>
            <div style={{ flex: 1 }}>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, marginBottom: 18 }}
                  onError={e => e.target.style.display = 'none'} />
              )}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ backgroundColor: '#f8ece6', color: '#b55139', padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-block', marginBottom: '10px' }}>
                  {form.category || 'Danh mục bài viết'}
                </span>
                <h2 style={{ fontSize: '1.8rem', color: '#1e2035', margin: '0 0 10px 0', fontWeight: 800, lineHeight: 1.3 }}>
                  {form.title || 'Tiêu đề bài viết'}
                </h2>
                <p style={{ color: '#566474', fontStyle: 'italic', margin: 0, fontSize: '0.95rem', lineHeight: 1.45 }}>
                  {form.description || 'Mô tả ngắn của bài viết...'}
                </p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(93,110,126,0.12)', margin: '20px 0' }} />
              <div
                className="article-rich-content"
                dangerouslySetInnerHTML={{ __html: form.content || '<p style="color:#aaa;font-style:italic;">Nội dung bài viết sẽ tự động hiển thị ở đây...</p>' }}
                style={{ color: '#2d3748', fontSize: '1rem', lineHeight: '1.75' }}
              />
            </div>
          </div>
        </div>
        {renderToast()}
      </div>
    );
  }

  // ─── List View ──────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="admin-section-header">
        <h2>📝 Bài viết / Kiến thức</h2>
        <button className="admin-add-btn" onClick={openAdd}>+ Thêm bài viết</button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Tất cả', ...categories].map(cat => (
          <button key={cat} onClick={() => { setFilterCat(cat); setPage(1); }}
            style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--admin-border)', background: filterCat === cat ? 'var(--admin-accent)' : 'transparent', color: filterCat === cat ? '#fff' : 'var(--admin-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            {cat}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading">Đang tải...</div> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th><th>Danh mục</th><th>Tiêu đề</th><th>Mô tả</th><th>Nội dung</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    ) : <span style={{ fontSize: '1.2rem' }}>🖼️</span>}
                  </td>
                  <td><span className="admin-badge">{item.category}</span></td>
                   <td title={item.title}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontWeight: 600 }}>{item.title}</span>
                      {item.isLatest && (
                        <span style={{ alignSelf: 'start', backgroundColor: '#eb5e28', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: '0.68rem', fontWeight: 700 }}>
                          🔥 Mới nhất
                        </span>
                      )}
                    </div>
                  </td>
                  <td title={item.description}>{item.description}</td>
                  <td>
                    {item.content ? (
                      <span style={{ color: 'var(--admin-accent)', fontWeight: 600 }}>Chi tiết ({item.content.length} ký tự)</span>
                    ) : <span style={{ color: 'var(--admin-muted)' }}>Chưa soạn thảo</span>}
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
            <button key={i} onClick={() => setPage(i + 1)}
              style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: page === i + 1 ? 'var(--admin-accent)' : 'var(--admin-surface2)', color: page === i + 1 ? '#fff' : 'var(--admin-muted)', cursor: 'pointer', fontWeight: 600 }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmDialog message="Bài viết này sẽ bị xoá vĩnh viễn." onYes={handleDelete} onNo={() => setConfirmId(null)} />
      )}
      {renderToast()}
    </div>
  );
}
