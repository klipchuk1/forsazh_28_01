import React from 'react';
import { motion } from 'framer-motion';
import { useCounterAnimation } from '../hooks/useCounterAnimation';

/* Speedometer gauge */
function Speedometer({
  labels,
  needlePosition,
  color,
  index,
}: {
  labels: string[];
  needlePosition: number; // 0..1 where 0=left, 1=right
  color: string;
  index: number;
}) {
  const w = 120;
  const h = 80;
  const cx = w / 2;
  const cy = 65;
  const r = 45;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // t=0 → 210° (8 o'clock), t=1 → -30° (4 o'clock) — 240° sweep
  const angleAtFn = (t: number) => 210 - t * 240;

  const ptAt = (t: number, radius: number) => {
    const a = toRad(angleAtFn(t));
    return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) };
  };

  // Background arc path
  const arcPts = Array.from({ length: 50 }, (_, i) => ptAt(i / 49, r));
  const bgPath = `M ${arcPts[0].x} ${arcPts[0].y} ` +
    arcPts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

  // Filled arc (up to needle position)
  const filledPts = arcPts.slice(0, Math.round(needlePosition * 49) + 1);
  const fillPath = filledPts.length > 1
    ? `M ${filledPts[0].x} ${filledPts[0].y} ` + filledPts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Tick marks
  const ticks = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const isMajor = i % 3 === 0;
    const outer = ptAt(t, r);
    const inner = ptAt(t, r - (isMajor ? 8 : 5));
    return { outer, inner, isMajor, t };
  });

  // Label positions
  const labelPositions = labels.map((_, i) => {
    const t = i / (labels.length - 1);
    return ptAt(t, r + 13);
  });

  // Needle
  const needleTip = ptAt(needlePosition, r - 12);
  const perpAngle = toRad(angleAtFn(needlePosition) + 90);
  const needleBase1 = { x: cx + 3 * Math.cos(perpAngle), y: cy - 3 * Math.sin(perpAngle) };
  const needleBase2 = { x: cx - 3 * Math.cos(perpAngle), y: cy + 3 * Math.sin(perpAngle) };

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
      <defs>
        <linearGradient id={`gg-${index}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Background arc */}
      <path d={bgPath} fill="none" stroke="#ffffff10" strokeWidth="5" strokeLinecap="round" />

      {/* Colored filled arc */}
      {fillPath && (
        <motion.path
          d={fillPath}
          fill="none"
          stroke={`url(#gg-${index})`}
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 + index * 0.2, ease: 'easeOut' }}
        />
      )}

      {/* Tick marks */}
      {ticks.map((tick, i) => (
        <line key={i}
          x1={tick.inner.x} y1={tick.inner.y}
          x2={tick.outer.x} y2={tick.outer.y}
          stroke={tick.isMajor ? '#ffffff50' : '#ffffff18'}
          strokeWidth={tick.isMajor ? 1.5 : 0.7}
          strokeLinecap="round"
        />
      ))}

      {/* Labels */}
      {labels.map((label, i) => (
        <text key={i}
          x={labelPositions[i].x}
          y={labelPositions[i].y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffffaa"
          fontSize="8"
          fontFamily="Rajdhani, sans-serif"
          fontWeight="700"
        >
          {label}
        </text>
      ))}

      {/* Needle — animated */}
      <motion.polygon
        points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
        fill={color}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
      />

      {/* Needle glow */}
      <motion.line
        x1={cx} y1={cy}
        x2={needleTip.x} y2={needleTip.y}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
      />

      {/* Center cap */}
      <circle cx={cx} cy={cy} r="4.5" fill="#1a1a2e" stroke="#ffffff20" strokeWidth="1" />
      <motion.circle
        cx={cx} cy={cy} r="2.5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.2 + index * 0.2 }}
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
  gaugeLabels,
  gaugeNeedle,
}: {
  value: number;
  label: string;
  color: string;
  change: string;
  icon: React.ReactNode;
  index: number;
  gaugeLabels: string[];
  gaugeNeedle: number;
}) {
  const animated = useCounterAnimation(value, 2000);
  const isPositive = !change.startsWith('-');

  return (
    <motion.div
      className="stat-card"
      style={{
        '--stat-color': color,
        position: 'relative',
        overflow: 'visible',
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
      {/* Animated top border */}
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

      {/* Layout: left info + right speedometer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="stat-card-icon" style={{
            background: `${color}18`,
            marginBottom: '10px',
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
              {icon}
            </svg>
          </div>

          <motion.div
            className="stat-card-value"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 + index * 0.15 }}
          >
            {animated.toLocaleString('ru-RU')}
          </motion.div>

          <div className="stat-card-label">{label}</div>

          <motion.div
            className={`stat-card-change ${isPositive ? 'positive' : 'negative'}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.8 + index * 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{
              display: 'inline-block', width: '6px', height: '6px',
              borderRadius: '50%', background: isPositive ? '#00ff88' : '#ff3366',
              boxShadow: `0 0 6px ${isPositive ? '#00ff8860' : '#ff336660'}`,
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            {change}
          </motion.div>
        </div>

        {/* Right — Speedometer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
          style={{ flexShrink: 0 }}
        >
          <Speedometer
            labels={gaugeLabels}
            needlePosition={gaugeNeedle}
            color={color}
            index={index}
          />
        </motion.div>
      </div>

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
        gaugeLabels={['МАРТ', 'АПР', 'МАЙ']}
        gaugeNeedle={0}
        icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
      />
      <StatCard
        value={1500}
        label="Торговых точек"
        color="#00d4ff"
        change="План подключения"
        index={1}
        gaugeLabels={['500', '1000', '1500']}
        gaugeNeedle={0.5}
        icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>}
      />
      <StatCard
        value={19}
        label="Лучших экипажей"
        color="#a855f7"
        change="Все активны"
        index={2}
        gaugeLabels={['30%', '50%', '100%']}
        gaugeNeedle={1}
        icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
      />
    </div>
  );
}
