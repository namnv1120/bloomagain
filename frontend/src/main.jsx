import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { useLocation } from './hooks/useLocation';

function Root() {
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');

  return isAdmin ? <AdminDashboard /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
