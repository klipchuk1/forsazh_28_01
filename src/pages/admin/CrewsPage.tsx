import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useCrews } from '../../hooks/useCrews';
import { supabase } from '../../lib/supabase';
import type { Crew } from '../../data/types';
import CrewForm from './CrewForm';

export default function CrewsPage() {
  const { crews, loading, refetch } = useCrews();
  const [editCrew, setEditCrew] = useState<Crew | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Crew | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('crews').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setDeleting(false);
    refetch();
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditCrew(undefined);
    refetch();
  };

  const openCreate = () => {
    setEditCrew(undefined);
    setShowForm(true);
  };

  const openEdit = (crew: Crew) => {
    setEditCrew(crew);
    setShowForm(true);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Экипажи</h1>
          <p className="admin-page-subtitle">Управление командами соревнования</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          Добавить экипаж
        </button>
      </div>

      {loading ? (
        <div className="admin-empty">
          <div className="admin-empty-text">Загрузка...</div>
        </div>
      ) : crews.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🏎</div>
          <div className="admin-empty-text">Экипажи ещё не добавлены</div>
          <button className="admin-btn admin-btn-secondary" onClick={openCreate} style={{ marginTop: '16px' }}>
            <Plus size={16} />
            Добавить первый экипаж
          </button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Цвет</th>
                <th>Команда</th>
                <th>Водитель</th>
                <th>Штурман</th>
                <th>Точки</th>
                <th>Продажи</th>
                <th>SKU</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {crews.map((crew, i) => (
                <tr key={crew.id}>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: "'Orbitron', sans-serif", fontSize: '12px' }}>
                    {i + 1}
                  </td>
                  <td>
                    <div
                      className="admin-color-dot"
                      style={{
                        background: crew.color,
                        '--dot-glow': crew.glowColor,
                      } as React.CSSProperties}
                    />
                  </td>
                  <td style={{ fontWeight: 600, color: crew.color }}>{crew.teamName}</td>
                  <td>{crew.driver.name}</td>
                  <td>{crew.navigator.name}</td>
                  <td style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '12px' }}>
                    {crew.metrics.connectedPoints.fact}/{crew.metrics.connectedPoints.target}
                  </td>
                  <td style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '12px' }}>
                    {crew.metrics.salesVolume.fact}/{crew.metrics.salesVolume.target}
                  </td>
                  <td style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '12px' }}>
                    {crew.metrics.skuCount.fact}/{crew.metrics.skuCount.target}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="admin-btn-icon" onClick={() => openEdit(crew)} title="Редактировать">
                        <Pencil size={14} />
                      </button>
                      <button
                        className="admin-btn-icon"
                        onClick={() => setDeleteTarget(crew)}
                        title="Удалить"
                        style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <CrewForm
          crew={editCrew}
          onClose={() => { setShowForm(false); setEditCrew(undefined); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h2 className="admin-modal-title">Удалить экипаж?</h2>
            <p className="admin-confirm-text">
              Вы уверены, что хотите удалить экипаж{' '}
              <span className="admin-confirm-name">{deleteTarget.teamName}</span>?
              Все данные команды (метрики, история, очки) будут удалены безвозвратно.
            </p>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Отмена
              </button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
