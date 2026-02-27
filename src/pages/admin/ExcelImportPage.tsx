import { useState } from 'react';
import { Upload, CheckCircle, Trophy, Users } from 'lucide-react';
import ExcelImport from '../../components/ExcelImport';
import type { ImportResult, ParsedCrew } from '../../components/ExcelImport';
import { useCrews } from '../../hooks/useCrews';
import { supabase } from '../../lib/supabase';

// Colors for crews (same as mockData)
const crewColors = [
  { color: '#FF3366', glow: 'rgba(255, 51, 102, 0.6)' },
  { color: '#00D4FF', glow: 'rgba(0, 212, 255, 0.6)' },
  { color: '#FFD600', glow: 'rgba(255, 214, 0, 0.6)' },
  { color: '#00FF88', glow: 'rgba(0, 255, 136, 0.6)' },
  { color: '#FF6B35', glow: 'rgba(255, 107, 53, 0.6)' },
  { color: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)' },
  { color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.6)' },
  { color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.6)' },
  { color: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
  { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },
  { color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)' },
  { color: '#EC4899', glow: 'rgba(236, 72, 153, 0.6)' },
  { color: '#14B8A6', glow: 'rgba(20, 184, 166, 0.6)' },
  { color: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' },
  { color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)' },
  { color: '#F97316', glow: 'rgba(249, 115, 22, 0.6)' },
  { color: '#22C55E', glow: 'rgba(34, 197, 94, 0.6)' },
  { color: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.6)' },
  { color: '#D946EF', glow: 'rgba(217, 70, 239, 0.6)' },
];

interface ImportSummary {
  createdCrews: number;
  updatedCrews: number;
  updatedAwards: number;
}

export default function ExcelImportPage() {
  const { crews, refetch } = useCrews();
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (result: ImportResult) => {
    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      let createdCrewCount = 0;
      let updatedCrewCount = 0;
      let updatedAwardCount = 0;

      // Build a map of crew name -> DB crew (refresh from DB first)
      const { data: dbCrews } = await supabase.from('crews').select('id, team_name');
      const crewMap = new Map<string, number>(); // name.toLowerCase() -> id
      for (const c of (dbCrews || [])) {
        crewMap.set(c.team_name.toLowerCase(), c.id);
      }

      // Use raw parsed crew data from Excel (works even when DB is empty)
      const parsedCrews: ParsedCrew[] = result.parsedCrews;

      // --- 1. Create crews that don't exist yet ---
      // Collect all crew names from both parsedCrews and awards
      const allCrewNames = new Set<string>();
      for (const pc of parsedCrews) {
        allCrewNames.add(pc.teamName);
      }
      for (const award of result.awards) {
        allCrewNames.add(award.crewName);
      }

      // Create missing crews
      for (const name of allCrewNames) {
        if (!crewMap.has(name.toLowerCase())) {
          const numMatch = name.match(/(\d+)/);
          const idx = numMatch ? parseInt(numMatch[1]) - 1 : crewMap.size;
          const colorSet = crewColors[idx % crewColors.length];

          // Find matching Excel data for this crew
          const pc = parsedCrews.find(c =>
            c.teamName.toLowerCase() === name.toLowerCase()
          );

          const { data: newCrew, error: createErr } = await supabase
            .from('crews')
            .insert({
              team_name: name,
              driver_name: pc?.driverName || 'Гонщик',
              driver_avatar: '',
              navigator_name: pc?.navigatorName || 'Штурман',
              navigator_avatar: '',
              color: colorSet.color,
              glow_color: colorSet.glow,
              sort_order: idx,
            })
            .select('id')
            .single();

          if (createErr) {
            console.error('Failed to create crew:', name, createErr.message);
            continue;
          }

          crewMap.set(name.toLowerCase(), newCrew.id);
          createdCrewCount++;
        }
      }

      // --- 2. Update crew data and metrics from parsed Excel rows ---
      for (const pc of parsedCrews) {
        const crewId = crewMap.get(pc.teamName.toLowerCase());
        if (!crewId) continue;

        // Update names
        await supabase.from('crews').update({
          driver_name: pc.driverName || 'Гонщик',
          navigator_name: pc.navigatorName || 'Штурман',
        }).eq('id', crewId);

        // Upsert metrics (score goes to connected_points fact)
        const metricsToUpsert = [
          { crew_id: crewId, metric: 'connected_points' as const, target: 100, fact: pc.score || 0 },
          { crew_id: crewId, metric: 'sales_volume' as const, target: 100, fact: 0 },
          { crew_id: crewId, metric: 'sku_count' as const, target: 100, fact: 0 },
        ];

        await supabase.from('crew_metrics').upsert(metricsToUpsert, { onConflict: 'crew_id,metric' });
        updatedCrewCount++;
      }

      // --- 3. Insert awards ---
      if (result.awards.length > 0) {
        const months = [...new Set(result.awards.map(a => a.month))];

        for (const month of months) {
          const monthAwards = result.awards.filter(a => a.month === month);

          const awardsWithIds: { crew_id: number; award_label: string; category: string; place: number; month: string }[] = [];

          for (const award of monthAwards) {
            const crewId = crewMap.get(award.crewName.toLowerCase());
            if (crewId) {
              awardsWithIds.push({
                crew_id: crewId,
                award_label: award.awardLabel,
                category: award.category,
                place: award.place,
                month: award.month,
              });
            }
          }

          if (awardsWithIds.length > 0) {
            // Delete old awards for this month for these crews
            const crewIds = [...new Set(awardsWithIds.map(a => a.crew_id))];
            await supabase.from('crew_awards').delete().in('crew_id', crewIds).eq('month', month);

            const { error: awardsErr } = await supabase.from('crew_awards').insert(awardsWithIds);

            if (awardsErr) {
              setError(`Ошибка наград: ${awardsErr.message}`);
              setImporting(false);
              return;
            }

            updatedAwardCount += awardsWithIds.length;
          }
        }
      }

      setImportResult({ createdCrews: createdCrewCount, updatedCrews: updatedCrewCount, updatedAwards: updatedAwardCount });
      refetch();
    } catch (e) {
      setError(`Ошибка при импорте: ${e instanceof Error ? e.message : 'неизвестная ошибка'}`);
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
          {importResult.createdCrews > 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} />
              Создано экипажей: <strong style={{ color: 'var(--accent-green, #00FF88)' }}>{importResult.createdCrews}</strong>
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
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
          Если экипажей нет в базе — они будут созданы автоматически.
        </p>
      </div>
    </div>
  );
}
