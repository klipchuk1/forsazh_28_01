import React from 'react';
import { motion } from 'framer-motion';
import { useCounterAnimation } from '../hooks/useCounterAnimation';

/* Tiny sparkline SVG */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data.map((v, i) => {
    const px = (i / (data.length - 1)) * w;
    const py = h - ((v - min) / range) * (h - 2) - 1;
    return `${px},${py}`;
  }).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Circular progress ring around icon */
function ProgressRing({ progress, color, size = 42 }: { progress: number; color: string; size?: number }) {
  const r = (size - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: -2, left: -2 }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={`${color}15`} strokeWidth="2.5" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    </svg>
  );
}

function StatCard({
  value,
  label,
  color,
  change,
  icon,
  index,
  progress,
  sparkData,
}: {
  value: number;
  label: string;
  color: string;
  change: string;
  icon: React.ReactNode;
  index: number;
  progress: number;
  sparkData: number[];
}) {
  const animated = useCounterAnimation(value, 2000);
  const isPositive = !change.startsWith('-');

  return (
    <motion.div
      className="stat-card"
      style={{
        '--stat-color': color,
        position: 'relative',
        overflow: 'hidden',
      } as React.CSSProperties}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        scale: 1.03,
        boxShadow: `0 0 25px ${color}30, 0 8px 30px rgba(0,0,0,0.3)`,
        borderColor: `${color}50`,
        transition: { duration: 0.25 },
      }}
    >
      {/* Animated gradient border — top line */}
      <motion.div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.6 + index * 0.15 }}
      />

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 'inherit',
        background: `radial-gradient(ellipse at top left, ${color}06 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      {/* Top row: icon with progress ring + sparkline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ position: 'relative', width: '42px', height: '42px' }}>
          <ProgressRing progress={progress} color={color} />
          <div className="stat-card-icon" style={{
            background: `${color}18`,
            width: '38px', height: '38px',
            margin: 0,
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
              {icon}
            </svg>
          </div>
        </div>

        {/* Sparkline */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 + index * 0.15 }}
        >
          <Sparkline data={sparkData} color={color} />
        </motion.div>
      </div>

      {/* Value */}
      <motion.div
        className="stat-card-value"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 + index * 0.15 }}
      >
        {animated.toLocaleString('ru-RU')}
      </motion.div>

      <div className="stat-card-label">{label}</div>

      {/* Status with live pulse */}
      <motion.div
        className={`stat-card-change ${isPositive ? 'positive' : 'negative'}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.8 + index * 0.15 }}
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        {/* Live pulse dot */}
        <span style={{
          display: 'inline-block', width: '6px', height: '6px',
          borderRadius: '50%', background: isPositive ? '#00ff88' : '#ff3366',
          boxShadow: `0 0 6px ${isPositive ? '#00ff8860' : '#ff336660'}`,
          animation: 'pulse-dot 2s ease-in-out infinite',
        }} />
        {change}
      </motion.div>

      {/* Inline keyframes for pulse */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </motion.div>
  );
}

export default function StatsBar() {
  return (
    <div className="stats-bar">
      <StatCard
        value={3}
        label="Месяца"
        color="#ff3366"
        change="Пилот проект"
        index={0}
        progress={0.25}
        sparkData={[0, 0.3, 0.5, 0.4, 0.7, 0.8, 1]}
        icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
      />
      <StatCard
        value={1500}
        label="Торговых точек"
        color="#00d4ff"
        change="План подключения"
        index={1}
        progress={0.65}
        sparkData={[100, 250, 400, 520, 700, 950, 1200, 1500]}
        icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>}
      />
      <StatCard
        value={19}
        label="Лучших экипажей"
        color="#a855f7"
        change="Все активны"
        index={2}
        progress={1}
        sparkData={[19, 19, 19, 19, 19, 19, 19]}
        icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
      />
    </div>
  );
}
