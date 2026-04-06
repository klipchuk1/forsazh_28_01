import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, BarChart3, Upload, Flag, LayoutDashboard, LogOut, ExternalLink } from 'lucide-react';
import '../styles/admin.css';

const navItems = [
  { to: '/control-panel', icon: LayoutDashboard, label: 'Обзор', end: true },
  { to: '/control-panel/crews', icon: Users, label: 'Экипажи', end: false },
  { to: '/control-panel/kpi', icon: BarChart3, label: 'KPI данные', end: false },
  { to: '/control-panel/import', icon: Upload, label: 'Импорт Excel', end: false },
  { to: '/control-panel/segments', icon: Flag, label: 'Этапы гонки', end: false },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-logo">ФОРСАЖ</span>
          <span className="admin-logo-sub">Панель управления</span>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-divider" />

        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-item admin-nav-external">
          <ExternalLink size={18} />
          <span>Открыть дашборд</span>
        </a>

        <div className="admin-sidebar-footer">
          <span className="admin-user-email">{user?.email}</span>
          <button className="admin-logout-btn" onClick={signOut}>
            <LogOut size={16} />
            Выход
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
