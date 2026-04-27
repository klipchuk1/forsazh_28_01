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
    // Try same-origin proxy first (works on mobile networks that block Supabase US),
    // fall back to direct Supabase if proxy fails.
    const trySource = async (fetcher: () => Promise<Crew[] | null>) => {
      try {
        const data = await fetcher();
        if (data && data.length > 0) {
          setCrews(normalize(data));
          setError(null);
          return true;
        }
      } catch { /* try next source */ }
      return false;
    };

    const fromProxy = async (): Promise<Crew[] | null> => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      try {
        const res = await fetch('/api/supabase/rest/v1/rpc/get_crews_full', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
          signal: ctrl.signal,
        });
        if (!res.ok) return null;
        return await res.json();
      } finally { clearTimeout(t); }
    };

    const fromDirect = async (): Promise<Crew[] | null> => {
      const { data, error: err } = await supabase.rpc('get_crews_full');
      if (err) throw err;
      return data;
    };

    if (await trySource(fromProxy)) return;
    await trySource(fromDirect);
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
