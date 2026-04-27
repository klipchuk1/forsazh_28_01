import { useState, useEffect, useCallback } from 'react';
import type { Crew } from '../data/types';
import { supabase } from '../lib/supabase';
import { mockCrews } from '../data/mockData';

const branchById: Record<number, string> = {
  1: 'Экспресс', 2: 'Сервис 77', 3: 'Сервис 77',
  4: 'Краснодар', 5: 'Краснодар', 6: 'Армавир', 7: 'Армавир',
  8: 'Симферополь', 9: 'Симферополь', 10: 'Севастополь',
  11: 'Абакан', 12: 'Красноярск', 13: 'Уссурийск',
  14: 'Владивосток', 15: 'Владивосток', 16: 'Иркутск', 17: 'Иркутск',
  18: 'Благовещенск', 19: 'Якутск',
};

function normalize(data: Crew[]): Crew[] {
  return data.map((c) => ({
    ...c,
    awards: c.awards ?? [],
    branch: c.branch || branchById[c.id] || '',
  }));
}

export function useCrews() {
  const [crews, setCrews] = useState<Crew[]>(mockCrews);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCrews = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.rpc('get_crews_full');
      if (err) throw err;
      if (data && data.length > 0) {
        setCrews(normalize(data));
      }
      setError(null);
    } catch {
      // Keep showing current mockData silently
      setError(null);
    }
  }, []);

  useEffect(() => {
    fetchCrews();

    const channel = supabase
      .channel('crews-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crews' }, () => fetchCrews())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_metrics' }, () => fetchCrews())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_segment_scores' }, () => fetchCrews())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_history' }, () => fetchCrews())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_awards' }, () => fetchCrews())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCrews]);

  return { crews, loading, error, refetch: fetchCrews };
}
