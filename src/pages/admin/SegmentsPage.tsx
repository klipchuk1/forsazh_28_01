import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSegments } from '../../hooks/useSegments';
import { supabase } from '../../lib/supabase';
import type { Segment } from '../../data/types';

const SEGMENT_COLORS: Record<string, string> = {
  warmup: 'var(--accent-gold)',
  lap1: 'var(--accent-secondary)',
  lap2: 'var(--accent-green)',
  lap3: 'var(--accent-primary)',
};

const SEGMENT_ICONS: Record<string, string> = {
  warmup: '🏁',
  lap1: '1️⃣',
  lap2: '2️⃣',
  lap3: '3️⃣',
};

export default function SegmentsPage() {
  const { segments, loading, refetch } = useSegments();
  const [values, setValues] = useState<Segment[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (segments.length > 0) {
      setValues(segments.map(s => ({ ...s })));
      setDirty(false);
    }
  }, [segments]);

  const updateSegment = (index: number, field: keyof Segment, value: string | number) => {
    setValues(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);

    for (const seg of values) {
      await supabase
        .from('segments')
        .update({
          label: seg.label,
          start_date: seg.start_date,
          end_date: seg.end_date,
          weight: seg.weight,
        })
        .eq('key', seg.key);
    }

    setSaving(false);
    setSaved(true);
    setDirty(false);
    refetch();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Этапы гонки</h1>
          <p className="admin-page-subtitle">Настройка дат и весов для каждого сегмента</p>
        </div>
        {dirty && (
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        )}
      </div>

      {saved && !dirty && (
        <div className="admin-kpi-save-bar" style={{ borderColor: 'rgba(0, 255, 136, 0.3)' }}>
          <span style={{ color: 'var(--accent-green)' }}>Настройки этапов сохранены</span>
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          <div className="admin-empty-text">Загрузка...</div>
        </div>
      ) : values.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🏁</div>
          <div className="admin-empty-text">Этапы ещё не настроены. Создайте их в Supabase.</div>
        </div>
      ) : (
        <div className="admin-segments-grid">
          {values.map((seg, idx) => (
            <div
              key={seg.key}
              className="admin-segment-card"
              style={{ '--segment-color': SEGMENT_COLORS[seg.key] } as React.CSSProperties}
            >
              <div className="admin-segment-label">
                {SEGMENT_ICONS[seg.key]} {seg.label}
              </div>

              <div className="admin-segment-fields">
                <div className="admin-field">
                  <label className="admin-label">Название</label>
                  <input
                    type="text"
                    value={seg.label}
                    onChange={e => updateSegment(idx, 'label', e.target.value)}
                    className="admin-input"
                  />
                </div>

                <div className="admin-segment-row">
                  <div className="admin-field">
                    <label className="admin-label">Дата начала</label>
                    <input
                      type="date"
                      value={seg.start_date}
                      onChange={e => updateSegment(idx, 'start_date', e.target.value)}
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">Дата окончания</label>
                    <input
                      type="date"
                      value={seg.end_date}
                      onChange={e => updateSegment(idx, 'end_date', e.target.value)}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Вес этапа (0-1)</label>
                  <input
                    type="number"
                    value={seg.weight}
                    onChange={e => updateSegment(idx, 'weight', parseFloat(e.target.value) || 0)}
                    className="admin-input"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {values.length > 0 && (
        <div style={{ marginTop: '24px', padding: '16px 20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Сумма весов:{' '}
            <span style={{
              fontFamily: "'Orbitron', sans-serif",
              color: Math.abs(values.reduce((s, v) => s + v.weight, 0) - 1) < 0.01 ? 'var(--accent-green)' : 'var(--accent-primary)',
            }}>
              {values.reduce((s, v) => s + v.weight, 0).toFixed(2)}
            </span>
            {Math.abs(values.reduce((s, v) => s + v.weight, 0) - 1) >= 0.01 && (
              <span style={{ color: 'var(--accent-primary)', marginLeft: '8px' }}>(должна быть 1.00)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
