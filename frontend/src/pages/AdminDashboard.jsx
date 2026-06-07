import React, { useState, useEffect } from 'react';
import '../admin.css';
import AdminLogin from './AdminLogin';
import ArticlesTab from './admin/ArticlesTab';
import ProductsTab from './admin/ProductsTab';
import FacilitiesTab from './admin/FacilitiesTab';
import SupportCentersTab from './admin/SupportCentersTab';
import SuggestionsTab from './admin/SuggestionsTab';
import StatsTab from './admin/StatsTab';
import { useLocation } from '../hooks/useLocation';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

const NAV_ITEMS = [
  { id: 'articles', label: 'Bài viết', icon: '📝' },
  { id: 'products', label: 'Sản phẩm', icon: '🛍️' },
  { id: 'facilities', label: 'Cơ sở y tế', icon: '🏥' },
  { id: 'support', label: 'Trung tâm bảo trợ', icon: '🏠' },
  { id: 'suggestions', label: 'Gợi ý', icon: '💡' },
  { id: 'stats', label: 'Thống kê', icon: '📊' },
];

export default function AdminDashboard() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [adminUser, setAdminUser] = useState(() => localStorage.getItem('adminUser') || 'Admin');
  const [location, navigate] = useLocation();

  // Extract active tab ID from URL path (e.g. /admin/products -> products)
  const getActiveTab = () => {
    const parts = location.split('/');
    const tabId = parts[2];
    return NAV_ITEMS.some(item => item.id === tabId) ? tabId : 'articles';
  };

  const activeTab = getActiveTab();

  // Verify token on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/admin/articles`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (!res.ok) handleLogout();
    }).catch(() => { });
  }, [token]);

  const handleLogin = (t, user) => {
    setToken(t);
    setAdminUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    navigate('/');
  };

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'articles': return <ArticlesTab token={token} />;
      case 'products': return <ProductsTab token={token} />;
      case 'facilities': return <FacilitiesTab token={token} />;
      case 'support': return <SupportCentersTab token={token} />;
      case 'suggestions': return <SuggestionsTab token={token} />;
      case 'stats': return <StatsTab token={token} />;
      default: return <ArticlesTab token={token} />;
    }
  };

  const currentNav = NAV_ITEMS.find(n => n.id === activeTab);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>🌸 Bloom Again</h2>
          <span>Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(`/admin/${item.id}`)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginBottom: 10 }}>
            Đăng nhập với: <strong style={{ color: 'white' }}>{adminUser}</strong>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <h3>{currentNav?.icon} {currentNav?.label}</h3>
          <span className="admin-topbar-meta">Bloom Again CMS • {new Date().toLocaleDateString('vi-VN')}</span>
        </header>

        <main className="admin-content">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
