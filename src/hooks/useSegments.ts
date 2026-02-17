import { useState, useEffect, useCallback } from 'react';
import type { Segment } from '../data/types';
import { supabase } from '../lib/supabase';

export function useSegments() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSegments = useCallback(async () => {
    const { data } = await supabase
      .from('segments')
      .select('*')
      .order('id');
    setSegments(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  return { segments, loading, refetch: fetchSegments };
}
