import { useState, useEffect, useCallback } from 'react';
import type { Crew } from '../data/types';
import { supabase } from '../lib/supabase';

export function useCrews() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCrews = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.rpc('get_crews_full');
      if (err) throw err;
      // Ensure awards array exists on every crew (in case RPC doesn't return it yet)
      const crewsData = (data ?? []).map((c: Crew) => ({ ...c, awards: c.awards ?? [] }));
      setCrews(crewsData);
      setError(null);
    } catch {
      // Fallback to mock data if Supabase is not configured or unreachable
      const { mockCrews } = await import('../data/mockData');
      setCrews(mockCrews);
      setError('Supabase недоступен, используются демо-данные');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCrews();

    // Real-time: re-fetch when crew-related tables change
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
