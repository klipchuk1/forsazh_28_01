import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface VoteButtonProps {
  crewId: number;
  color: string;
}

function getVoterId(): string {
  let id = localStorage.getItem('forsazh_voter_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('forsazh_voter_id', id);
  }
  return id;
}

interface FlyingThumb {
  id: number;
  x: number;
}

export default function VoteButton({ crewId, color }: VoteButtonProps) {
  const [count, setCount] = useState(0);
  const [voted, setVoted] = useState(false);
  const [hearts, setHearts] = useState<FlyingThumb[]>([]);
  const [animating, setAnimating] = useState(false);

  const voterId = getVoterId();

  const fetchCount = useCallback(async () => {
    const { count: c } = await supabase
      .from('crew_votes')
      .select('*', { count: 'exact', head: true })
      .eq('crew_id', crewId);
    setCount(c ?? 0);
  }, [crewId]);

  const checkVoted = useCallback(async () => {
    const { data } = await supabase
      .from('crew_votes')
      .select('id')
      .eq('crew_id', crewId)
      .eq('voter_id', voterId)
      .maybeSingle();
    setVoted(!!data);
  }, [crewId, voterId]);

  useEffect(() => {
    fetchCount();
    checkVoted();

    const channel = supabase
      .channel(`votes-${crewId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_votes', filter: `crew_id=eq.${crewId}` }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [crewId, fetchCount, checkVoted]);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (voted) return;

    setAnimating(true);
    setVoted(true);
    setCount(prev => prev + 1);

    // Spawn flying thumbs
    const newHearts: FlyingThumb[] = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
    }));
    setHearts(prev => [...prev, ...newHearts]);

    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.includes(h)));
    }, 1200);

    await supabase.from('crew_votes').insert({ crew_id: crewId, voter_id: voterId });

    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <motion.button
        onClick={handleVote}
        whileTap={!voted ? { scale: 1.3 } : undefined}
        animate={animating ? { scale: [1, 1.4, 1] } : undefined}
        style={{
          background: 'none',
          border: 'none',
          cursor: voted ? 'default' : 'pointer',
          padding: '4px',
          fontSize: '18px',
          lineHeight: 1,
          filter: voted ? `drop-shadow(0 0 6px ${color})` : 'none',
          transition: 'filter 0.3s',
        }}
        title={voted ? 'Вы уже проголосовали' : 'Поддержать команду'}
      >
        {voted ? '👍' : '👍🏻'}
      </motion.button>

      <span style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '11px',
        color: voted ? color : 'var(--text-secondary)',
        fontWeight: 600,
        minWidth: '16px',
        transition: 'color 0.3s',
      }}>
        {count}
      </span>

      {/* Flying thumbs */}
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.span
            key={heart.id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -80, x: heart.x, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: '8px',
              pointerEvents: 'none',
              fontSize: '16px',
            }}
          >
            👍
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
