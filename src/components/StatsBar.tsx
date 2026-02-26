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
  const size = 100;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const r = 38;

  // Arc from -135° to +135° (270° sweep)
  const startAngle = -225;
  const endAngle = 45;
  const sweepAngle = endAngle - startAngle; // 270

  // Tick positions for labels
  const labelAngles = labels.map((_, i) => {
    const t = i / (labels.length - 1);
    return startAngle + t * sweepAngle;
  });

  // Needle angle
  const needleAngle = startAngle + needlePosition * sweepAngle;

  // Arc path helper
  const polarToXY = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  // Background arc
  const arcStart = polarToXY(startAngle, r);
  const arcEnd = polarToXY(endAngle, r);
  const bgArc = `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 1 1 ${arcEnd.x} ${arcEnd.y}`;

  // Filled arc (up to needle)
  const fillEnd = polarToXY(needleAngle, r);
  const largeArc = needlePosition > 0.5 ? 1 : 0;
  const fillArc = `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`;

  // Small tick marks
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    const angle = startAngle + t * sweepAngle;
    const isMajor = i % 5 === 0;
    const inner = polarToXY(angle, r - (isMajor ? 7 : 4));
    const outer = polarToXY(angle, r);
    return { inner, outer, isMajor };
  });

  // Needle tip
  const needleTip = polarToXY(needleAngle, r - 10);
  const needleBase1 = polarToXY(needleAngle + 90, 3);
  const needleBase2 = polarToXY(needleAngle - 90, 3);

  return (
    <svg width={size} height={size - 10} viewBox={`0 0 ${size} ${size - 10}`}>
      <defs>
        <linearGradient id={`gauge-grad-${index}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id={`needle-glow-${index}`}>
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background arc */}
      <path d={bgArc} fill="none" stroke="#ffffff08" strokeWidth="6" strokeLinecap="round" />

      {/* Filled arc */}
      <motion.path
        d={fillArc}
        fill="none"
        stroke={`url(#gauge-grad-${index})`}
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.5 + index * 0.15, ease: 'easeOut' }}
      />

      {/* Tick marks */}
      {ticks.map((tick, i) => (
        <line key={i}
          x1={tick.inner.x} y1={tick.inner.y}
          x2={tick.outer.x} y2={tick.outer.y}
          stroke={tick.isMajor ? '#ffffff40' : '#ffffff15'}
          strokeWidth={tick.isMajor ? 1.5 : 0.8}
          strokeLinecap="round"
        />
      ))}

      {/* Labels around arc */}
      {labels.map((label, i) => {
        const angle = labelAngles[i];
        const pos = polarToXY(angle, r + 12);
        return (
          <text key={i} x={pos.x} y={pos.y}
            textAnchor="middle" dominantBaseline="middle"
            fill="#ffffff80" fontSize="7" fontFamily="Rajdhani, sans-serif" fontWeight="600">
            {label}
          </text>
        );
      })}

      {/* Needle */}
      <motion.g
        filter={`url(#needle-glow-${index})`}
        initial={{ rotate: startAngle, originX: `${cx}px`, originY: `${cy}px` }}
        animate={{ rotate: needleAngle }}
        transition={{ duration: 1.2, delay: 0.8 + index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={color}
          opacity="0.9"
        />
      </motion.g>

      {/* Center cap */}
      <circle cx={cx} cy={cy} r="4" fill="#1a1a2e" stroke={color} strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="1.5" fill={color} />
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

      {/* Content layout: left info + right speedometer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Left side — icon, value, label */}
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

        {/* Right side — Speedometer */}
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
