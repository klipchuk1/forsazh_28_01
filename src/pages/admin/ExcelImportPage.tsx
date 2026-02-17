import { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import ExcelImport from '../../components/ExcelImport';
import { useCrews } from '../../hooks/useCrews';
import { supabase } from '../../lib/supabase';
import type { Crew } from '../../data/types';

export default function ExcelImportPage() {
  const { crews, refetch } = useCrews();
  const [importResult, setImportResult] = useState<{ updated: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (updatedCrews: Crew[]) => {
    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const metricsToUpsert = updatedCrews.flatMap(crew => [
        { crew_id: crew.id, metric: 'connected_points' as const, target: crew.metrics.connectedPoints.target, fact: crew.metrics.connectedPoints.fact },
        { crew_id: crew.id, metric: 'sales_volume' as const, target: crew.metrics.salesVolume.target, fact: crew.metrics.salesVolume.fact },
        { crew_id: crew.id, metric: 'sku_count' as const, target: crew.metrics.skuCount.target, fact: crew.metrics.skuCount.fact },
      ]);

      const { error: err } = await supabase
        .from('crew_metrics')
        .upsert(metricsToUpsert, { onConflict: 'crew_id,metric' });

      if (err) {
        setError(err.message);
      } else {
        const changed = updatedCrews.filter((uc, i) => {
          const orig = crews[i];
          if (!orig) return true;
          return (
            uc.metrics.connectedPoints.fact !== orig.metrics.connectedPoints.fact ||
            uc.metrics.salesVolume.fact !== orig.metrics.salesVolume.fact ||
            uc.metrics.skuCount.fact !== orig.metrics.skuCount.fact
          );
        });
        setImportResult({ updated: changed.length });
        refetch();
      }
    } catch {
      setError('Ошибка при импорте данных');
    }

    setImporting(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Импорт из Excel</h1>
          <p className="admin-page-subtitle">Загрузите файл с KPI данными для обновления метрик</p>
        </div>
      </div>

      <div className="admin-import-zone">
        <div className="admin-import-icon">
          <Upload size={48} />
        </div>
        <p className="admin-import-text">
          {importing ? 'Импортирование данных...' : 'Выберите Excel файл для импорта'}
        </p>
        <ExcelImport onImport={handleImport} existingCrews={crews} />
      </div>

      {error && (
        <div className="login-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {importResult && (
        <div className="admin-import-result">
          <div className="admin-import-result-title">
            <CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Импорт завершён
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Обновлено экипажей: <strong style={{ color: 'var(--text-primary)' }}>{importResult.updated}</strong>
          </p>
        </div>
      )}

      <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
          Формат файла
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Столбцы: <span style={{ color: 'var(--accent-secondary)' }}>Экипаж</span> | Driver | Navigator |
          Точки Plan | Точки Fact | Продажи Plan | Продажи Fact | СКЮ Plan | СКЮ Fact
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', opacity: 0.7 }}>
          Команды сопоставляются по названию (столбец «Экипаж»).
          Если название не найдено в базе, строка будет пропущена.
        </p>
      </div>
    </div>
  );
}
