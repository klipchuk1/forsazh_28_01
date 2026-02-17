import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useCrews } from '../../hooks/useCrews';
import { supabase } from '../../lib/supabase';

interface MetricValues {
  connectedPoints: { target: string; fact: string };
  salesVolume: { target: string; fact: string };
  skuCount: { target: string; fact: string };
}

type MetricsMap = Record<number, MetricValues>;

export default function KpiPage() {
  const { crews, loading, refetch } = useCrews();
  const [values, setValues] = useState<MetricsMap>({});
  const [dirty, setDirty] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (crews.length === 0) return;
    const initial: MetricsMap = {};
    for (const c of crews) {
      initial[c.id] = {
        connectedPoints: { target: String(c.metrics.connectedPoints.target), fact: String(c.metrics.connectedPoints.fact) },
        salesVolume: { target: String(c.metrics.salesVolume.target), fact: String(c.metrics.salesVolume.fact) },
        skuCount: { target: String(c.metrics.skuCount.target), fact: String(c.metrics.skuCount.fact) },
      };
    }
    setValues(initial);
    setDirty(new Set());
  }, [crews]);

  const updateValue = (crewId: number, metric: keyof MetricValues, field: 'target' | 'fact', val: string) => {
    setValues(prev => ({
      ...prev,
      [crewId]: {
        ...prev[crewId],
        [metric]: {
          ...prev[crewId][metric],
          [field]: val,
        },
      },
    }));
    setDirty(prev => new Set(prev).add(crewId));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const upserts: { crew_id: number; metric: string; target: number; fact: number }[] = [];

    for (const crewId of dirty) {
      const v = values[crewId];
      if (!v) continue;
      upserts.push(
        { crew_id: crewId, metric: 'connected_points', target: Number(v.connectedPoints.target) || 0, fact: Number(v.connectedPoints.fact) || 0 },
        { crew_id: crewId, metric: 'sales_volume', target: Number(v.salesVolume.target) || 0, fact: Number(v.salesVolume.fact) || 0 },
        { crew_id: crewId, metric: 'sku_count', target: Number(v.skuCount.target) || 0, fact: Number(v.skuCount.fact) || 0 },
      );
    }

    if (upserts.length > 0) {
      await supabase.from('crew_metrics').upsert(upserts, { onConflict: 'crew_id,metric' });
    }

    setSaving(false);
    setSaved(true);
    setDirty(new Set());
    refetch();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">KPI данные</h1>
          <p className="admin-page-subtitle">Редактирование целей и фактов по метрикам</p>
        </div>
      </div>

      {dirty.size > 0 && (
        <div className="admin-kpi-save-bar">
          <span>Изменено экипажей: {dirty.size}</span>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Сохранение...' : 'Сохранить все'}
          </button>
        </div>
      )}

      {saved && dirty.size === 0 && (
        <div className="admin-kpi-save-bar" style={{ borderColor: 'rgba(0, 255, 136, 0.3)' }}>
          <span style={{ color: 'var(--accent-green)' }}>Данные сохранены</span>
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          <div className="admin-empty-text">Загрузка...</div>
        </div>
      ) : (
        <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ verticalAlign: 'bottom' }}>Экипаж</th>
                <th colSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>Точки подключения</th>
                <th colSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>Объём продаж</th>
                <th colSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>SKU</th>
              </tr>
              <tr>
                <th style={{ borderLeft: '1px solid var(--border-subtle)' }}>План</th>
                <th>Факт</th>
                <th style={{ borderLeft: '1px solid var(--border-subtle)' }}>План</th>
                <th>Факт</th>
                <th style={{ borderLeft: '1px solid var(--border-subtle)' }}>План</th>
                <th>Факт</th>
              </tr>
            </thead>
            <tbody>
              {crews.map(crew => {
                const v = values[crew.id];
                if (!v) return null;
                const isDirty = dirty.has(crew.id);

                return (
                  <tr key={crew.id}>
                    <td style={{ fontWeight: 600, color: crew.color, whiteSpace: 'nowrap' }}>
                      {crew.teamName}
                    </td>
                    <td style={{ borderLeft: '1px solid var(--border-subtle)' }}>
                      <input
                        type="number"
                        value={v.connectedPoints.target}
                        onChange={e => updateValue(crew.id, 'connectedPoints', 'target', e.target.value)}
                        className={`admin-kpi-input ${isDirty ? 'dirty' : ''}`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={v.connectedPoints.fact}
                        onChange={e => updateValue(crew.id, 'connectedPoints', 'fact', e.target.value)}
                        className={`admin-kpi-input ${isDirty ? 'dirty' : ''}`}
                      />
                    </td>
                    <td style={{ borderLeft: '1px solid var(--border-subtle)' }}>
                      <input
                        type="number"
                        value={v.salesVolume.target}
                        onChange={e => updateValue(crew.id, 'salesVolume', 'target', e.target.value)}
                        className={`admin-kpi-input ${isDirty ? 'dirty' : ''}`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={v.salesVolume.fact}
                        onChange={e => updateValue(crew.id, 'salesVolume', 'fact', e.target.value)}
                        className={`admin-kpi-input ${isDirty ? 'dirty' : ''}`}
                      />
                    </td>
                    <td style={{ borderLeft: '1px solid var(--border-subtle)' }}>
                      <input
                        type="number"
                        value={v.skuCount.target}
                        onChange={e => updateValue(crew.id, 'skuCount', 'target', e.target.value)}
                        className={`admin-kpi-input ${isDirty ? 'dirty' : ''}`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={v.skuCount.fact}
                        onChange={e => updateValue(crew.id, 'skuCount', 'fact', e.target.value)}
                        className={`admin-kpi-input ${isDirty ? 'dirty' : ''}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
