import { Link } from 'react-router-dom';
import { Users, BarChart3, Upload, Flag } from 'lucide-react';
import { useCrews } from '../../hooks/useCrews';

export default function AdminDashboard() {
  const { crews, loading } = useCrews();

  const totalCrews = crews.length;
  const avgCompletion = totalCrews > 0
    ? Math.round(crews.reduce((sum, c) => {
        const pct = c.metrics.connectedPoints.target > 0
          ? (c.metrics.connectedPoints.fact / c.metrics.connectedPoints.target) * 100
          : 0;
        return sum + pct;
      }, 0) / totalCrews)
    : 0;

  const topCrew = crews.length > 0
    ? crews.reduce((best, c) => {
        const bestPct = best.metrics.connectedPoints.target > 0
          ? best.metrics.connectedPoints.fact / best.metrics.connectedPoints.target
          : 0;
        const cPct = c.metrics.connectedPoints.target > 0
          ? c.metrics.connectedPoints.fact / c.metrics.connectedPoints.target
          : 0;
        return cPct > bestPct ? c : best;
      })
    : null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Обзор</h1>
          <p className="admin-page-subtitle">Общая информация о соревновании</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card" style={{ '--card-accent': 'var(--accent-secondary)' } as React.CSSProperties}>
          <div className="admin-stat-value">{loading ? '...' : totalCrews}</div>
          <div className="admin-stat-label">Экипажей</div>
        </div>
        <div className="admin-stat-card" style={{ '--card-accent': 'var(--accent-green)' } as React.CSSProperties}>
          <div className="admin-stat-value">{loading ? '...' : `${avgCompletion}%`}</div>
          <div className="admin-stat-label">Среднее выполнение</div>
        </div>
        <div className="admin-stat-card" style={{ '--card-accent': 'var(--accent-gold)' } as React.CSSProperties}>
          <div className="admin-stat-value">{loading ? '...' : (topCrew?.teamName ?? '-')}</div>
          <div className="admin-stat-label">Лидер</div>
        </div>
        <div className="admin-stat-card" style={{ '--card-accent': 'var(--accent-primary)' } as React.CSSProperties}>
          <div className="admin-stat-value">4</div>
          <div className="admin-stat-label">Этапов гонки</div>
        </div>
      </div>

      <h2 className="admin-page-title" style={{ fontSize: '14px', marginBottom: '16px' }}>Быстрые действия</h2>

      <div className="admin-quick-actions">
        <Link to="/admin/crews" className="admin-quick-action">
          <div className="admin-quick-action-icon">
            <Users size={20} />
          </div>
          <span className="admin-quick-action-text">Управление экипажами</span>
        </Link>
        <Link to="/admin/kpi" className="admin-quick-action">
          <div className="admin-quick-action-icon" style={{ background: 'rgba(255, 214, 0, 0.1)', color: 'var(--accent-gold)' }}>
            <BarChart3 size={20} />
          </div>
          <span className="admin-quick-action-text">Обновить KPI</span>
        </Link>
        <Link to="/admin/import" className="admin-quick-action">
          <div className="admin-quick-action-icon" style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--accent-green)' }}>
            <Upload size={20} />
          </div>
          <span className="admin-quick-action-text">Импорт из Excel</span>
        </Link>
      </div>

      <Link to="/admin/segments" className="admin-quick-action" style={{ maxWidth: '400px' }}>
        <div className="admin-quick-action-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
          <Flag size={20} />
        </div>
        <span className="admin-quick-action-text">Настройка этапов гонки</span>
      </Link>
    </div>
  );
}
