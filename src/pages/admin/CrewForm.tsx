import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { Crew } from '../../data/types';
import { supabase } from '../../lib/supabase';

interface CrewFormProps {
  crew?: Crew;
  onClose: () => void;
  onSaved: () => void;
}

export default function CrewForm({ crew, onClose, onSaved }: CrewFormProps) {
  const isEdit = !!crew;

  const [teamName, setTeamName] = useState(crew?.teamName ?? '');
  const [driverName, setDriverName] = useState(crew?.driver.name ?? '');
  const [driverAvatar, setDriverAvatar] = useState(crew?.driver.avatar ?? '');
  const [navigatorName, setNavigatorName] = useState(crew?.navigator.name ?? '');
  const [navigatorAvatar, setNavigatorAvatar] = useState(crew?.navigator.avatar ?? '');
  const [videoUrl, setVideoUrl] = useState(crew?.videoUrl ?? '');
  const [color, setColor] = useState(crew?.color ?? '#FF3366');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const hexToGlow = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const glowColor = hexToGlow(color);

    if (isEdit && crew) {
      const { error: err } = await supabase
        .from('crews')
        .update({
          team_name: teamName,
          driver_name: driverName,
          driver_avatar: driverAvatar,
          navigator_name: navigatorName,
          navigator_avatar: navigatorAvatar,
          video_url: videoUrl,
          color,
          glow_color: glowColor,
        })
        .eq('id', crew.id);

      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: err } = await supabase
        .from('crews')
        .insert({
          team_name: teamName,
          driver_name: driverName,
          driver_avatar: driverAvatar,
          navigator_name: navigatorName,
          navigator_avatar: navigatorAvatar,
          video_url: videoUrl,
          color,
          glow_color: glowColor,
        })
        .select()
        .single();

      if (err || !data) {
        setError(err?.message ?? 'Ошибка создания');
        setSaving(false);
        return;
      }

      // Create default metrics for the new crew
      await supabase.from('crew_metrics').insert([
        { crew_id: data.id, metric: 'connected_points', target: 0, fact: 0 },
        { crew_id: data.id, metric: 'sales_volume', target: 0, fact: 0 },
        { crew_id: data.id, metric: 'sku_count', target: 0, fact: 0 },
      ]);

      // Create default segment scores
      await supabase.from('crew_segment_scores').insert([
        { crew_id: data.id, segment_key: 'warmup', target: 0, fact: 0 },
        { crew_id: data.id, segment_key: 'lap1', target: 0, fact: 0 },
        { crew_id: data.id, segment_key: 'lap2', target: 0, fact: 0 },
        { crew_id: data.id, segment_key: 'lap3', target: 0, fact: 0 },
      ]);
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h2 className="admin-modal-title">
          {isEdit ? 'Редактировать экипаж' : 'Новый экипаж'}
        </h2>

        <form className="admin-modal-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="admin-field">
            <label className="admin-label">Название команды</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className="admin-input"
              placeholder="Молния"
              required
            />
          </div>

          <div className="admin-modal-row">
            <div className="admin-field">
              <label className="admin-label">Водитель</label>
              <input
                type="text"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="admin-input"
                placeholder="Имя Фамилия"
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Штурман</label>
              <input
                type="text"
                value={navigatorName}
                onChange={e => setNavigatorName(e.target.value)}
                className="admin-input"
                placeholder="Имя Фамилия"
                required
              />
            </div>
          </div>

          <div className="admin-modal-row">
            <div className="admin-field">
              <label className="admin-label">Аватар водителя (URL)</label>
              <input
                type="text"
                value={driverAvatar}
                onChange={e => setDriverAvatar(e.target.value)}
                className="admin-input"
                placeholder="https://..."
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Аватар штурмана (URL)</label>
              <input
                type="text"
                value={navigatorAvatar}
                onChange={e => setNavigatorAvatar(e.target.value)}
                className="admin-input"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Видео (URL или путь)</label>
            <input
              type="text"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              className="admin-input"
              placeholder="/videos/crew-1.mp4"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Цвет команды</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="admin-input-color"
              />
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="admin-input"
                style={{ width: '120px' }}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              <div
                className="admin-color-dot"
                style={{
                  background: color,
                  '--dot-glow': hexToGlow(color),
                } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
