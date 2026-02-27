import { useState } from 'react';
import { Upload, CheckCircle, Trophy } from 'lucide-react';
import ExcelImport from '../../components/ExcelImport';
import type { ImportResult } from '../../components/ExcelImport';
import { useCrews } from '../../hooks/useCrews';
import { supabase } from '../../lib/supabase';

export default function ExcelImportPage() {
  const { crews, refetch } = useCrews();
  const [importResult, setImportResult] = useState<{ updatedCrews: number; updatedAwards: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (result: ImportResult) => {
    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      let updatedCrewCount = 0;
      let updatedAwardCount = 0;

      // --- 1. Update crew metrics ---
      const metricsToUpsert = result.crews.flatMap(crew => [
        { crew_id: crew.id, metric: 'connected_points' as const, target: crew.metrics.connectedPoints.target, fact: crew.metrics.connectedPoints.fact },
        { crew_id: crew.id, metric: 'sales_volume' as const, target: crew.metrics.salesVolume.target, fact: crew.metrics.salesVolume.fact },
        { crew_id: crew.id, metric: 'sku_count' as const, target: crew.metrics.skuCount.target, fact: crew.metrics.skuCount.fact },
      ]);

      const { error: metricsErr } = await supabase
        .from('crew_metrics')
        .upsert(metricsToUpsert, { onConflict: 'crew_id,metric' });

      if (metricsErr) {
        setError(`Ошибка метрик: ${metricsErr.message}`);
        setImporting(false);
        return;
      }

      // Count changed crews
      const changed = result.crews.filter((uc, i) => {
        const orig = crews[i];
        if (!orig) return true;
        return (
          uc.metrics.connectedPoints.fact !== orig.metrics.connectedPoints.fact ||
          uc.metrics.salesVolume.fact !== orig.metrics.salesVolume.fact ||
          uc.metrics.skuCount.fact !== orig.metrics.skuCount.fact
        );
      });
      updatedCrewCount = changed.length;

      // --- 2. Update crew names if changed ---
      for (const uc of result.crews) {
        const orig = crews.find(c => c.id === uc.id);
        if (orig && (orig.driver.name !== uc.driver.name || orig.navigator.name !== uc.navigator.name)) {
          await supabase
            .from('crews')
            .update({ driver_name: uc.driver.name, navigator_name: uc.navigator.name })
            .eq('id', uc.id);
        }
      }

      // --- 3. Update awards ---
      if (result.awards.length > 0) {
        // Group awards by month
        const months = [...new Set(result.awards.map(a => a.month))];

        for (const month of months) {
          const monthAwards = result.awards.filter(a => a.month === month);

          // Resolve crew IDs from names
          const awardsWithIds: { crew_id: number; award_label: string; category: string; place: number; month: string }[] = [];

          for (const award of monthAwards) {
            const crew = crews.find(c => {
              const crewName = award.crewName.toLowerCase();
              return c.teamName.toLowerCase() === crewName ||
                     `экипаж ${c.id}` === crewName;
            });
            if (crew) {
              awardsWithIds.push({
                crew_id: crew.id,
                award_label: award.awardLabel,
                category: award.category,
                place: award.place,
                month: award.month,
              });
            }
          }

          if (awardsWithIds.length > 0) {
            // Delete old awards for this month, then insert new ones
            const crewIds = [...new Set(awardsWithIds.map(a => a.crew_id))];
            await supabase
              .from('crew_awards')
              .delete()
              .in('crew_id', crewIds)
              .eq('month', month);

            const { error: awardsErr } = await supabase
              .from('crew_awards')
              .insert(awardsWithIds);

            if (awardsErr) {
              setError(`Ошибка наград: ${awardsErr.message}`);
              setImporting(false);
              return;
            }

            updatedAwardCount = awardsWithIds.length;
          }
        }
      }

      setImportResult({ updatedCrews: updatedCrewCount, updatedAwards: updatedAwardCount });
      refetch();
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
          <p className="admin-page-subtitle">Загрузите файл Admin.xlsx для обновления данных экипажей и наград</p>
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
            Обновлено экипажей: <strong style={{ color: 'var(--text-primary)' }}>{importResult.updatedCrews}</strong>
          </p>
          {importResult.updatedAwards > 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={14} />
              Загружено наград: <strong style={{ color: 'var(--accent-gold, #FFD600)' }}>{importResult.updatedAwards}</strong>
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
          Формат файла
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <strong>Вкладка «Экипажи»:</strong> Название экипажа | Имя 1 | Имя 2 | Очки<br />
          <strong>Вкладка «Награды»:</strong> Список возможных наград по месяцам<br />
          <strong>Вкладка «Экипажи награды»:</strong> Название экипажа | Награда 1 | Награда 2 | ...
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', opacity: 0.7 }}>
          Экипажи сопоставляются по названию. Награды загружаются из вкладки, содержащей слово «наград».
        </p>
      </div>
    </div>
  );
}
