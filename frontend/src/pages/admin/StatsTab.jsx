import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

export default function StatsTab({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setStats(await res.json());
      } else {
        setError('Không thể tải dữ liệu thống kê từ server.');
      }
    } catch (err) {
      setError('Lỗi kết nối mạng.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return <div className="admin-loading">Đang tải thống kê...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--admin-accent)', padding: 24, textAlign: 'center' }}>❌ {error}</div>;
  }

  const { total = 0, gender = [], age = [], combined = [] } = stats || {};

  return (
    <div>
      <div className="admin-section-header">
        <h2>📊 Thống kê lượt chọn Onboarding</h2>
        <button className="admin-add-btn" onClick={fetchStats}>Làm mới</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', padding: '24px 20px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--admin-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Tổng lượt onboarding</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--admin-text)', marginTop: 8 }}>{total}</div>
        </div>

        {/* Top Gender Card */}
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', padding: '24px 20px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--admin-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Cơ cấu giới tính</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {gender.length === 0 ? <span style={{ color: 'var(--admin-muted)' }}>Chưa có dữ liệu</span> : (
              gender.map(g => (
                <div key={g.gender} style={{ background: 'var(--admin-surface2)', padding: '6px 12px', borderRadius: 8, fontSize: '0.82rem' }}>
                  <strong>{g.gender}</strong>: {g.count}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Age Group Card */}
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', padding: '24px 20px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--admin-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Nhóm tuổi tham gia nhiều</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {age.length === 0 ? <span style={{ color: 'var(--admin-muted)' }}>Chưa có dữ liệu</span> : (
              age.slice(0, 3).map(a => (
                <span key={a.age} className="admin-badge" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                  {a.age}: {a.count}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Gender and Age list */}
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>👥 Chi tiết giới tính & độ tuổi</h3>

          <div className="admin-table-wrap" style={{ margin: 0, border: 'none', background: 'transparent' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Giới tính</th>
                  <th>Độ tuổi</th>
                  <th>Lượt chọn</th>
                </tr>
              </thead>
              <tbody>
                {combined.sort((a, b) => b.count - a.count).map((c, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`admin-badge ${c.gender === 'Nữ' ? 'female' : c.gender === 'Nam' ? 'male' : 'lgbtq'}`} style={{
                        background: c.gender === 'Nữ' ? '#fee2e2' : c.gender === 'Nam' ? '#dbeafe' : '#f3e8ff',
                        color: c.gender === 'Nữ' ? '#ef4444' : c.gender === 'Nam' ? '#3b82f6' : '#a855f7',
                        border: 'none', fontWeight: 600
                      }}>
                        {c.gender}
                      </span>
                    </td>
                    <td>{c.age}</td>
                    <td style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{c.count} lượt</td>
                  </tr>
                ))}
                {combined.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-muted)' }}>Không có dữ liệu thống kê nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual progress stats representation */}
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>📊 Phân bố trực quan</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tỷ lệ giới tính</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {gender.map(g => {
                  const percentage = total > 0 ? Math.round((g.count / total) * 100) : 0;
                  return (
                    <div key={g.gender}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span>{g.gender}</span>
                        <strong>{percentage}% ({g.count} lượt)</strong>
                      </div>
                      <div style={{ height: 8, background: 'var(--admin-surface2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          background: g.gender === 'Nữ' ? '#ef4444' : g.gender === 'Nam' ? '#3b82f6' : '#a855f7',
                          width: `${percentage}%`,
                          borderRadius: 4
                        }} />
                      </div>
                    </div>
                  );
                })}
                {gender.length === 0 && <span style={{ fontSize: '0.82rem', color: 'var(--admin-muted)' }}>Chưa có biểu đồ phân bố</span>}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--admin-border)', margin: '8px 0' }} />

            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tỷ lệ độ tuổi</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {age.map(a => {
                  const percentage = total > 0 ? Math.round((a.count / total) * 100) : 0;
                  return (
                    <div key={a.age}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span>{a.age}</span>
                        <strong>{percentage}% ({a.count} lượt)</strong>
                      </div>
                      <div style={{ height: 8, background: 'var(--admin-surface2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          background: '#10b981',
                          width: `${percentage}%`,
                          borderRadius: 4
                        }} />
                      </div>
                    </div>
                  );
                })}
                {age.length === 0 && <span style={{ fontSize: '0.82rem', color: 'var(--admin-muted)' }}>Chưa có biểu đồ phân bố</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
