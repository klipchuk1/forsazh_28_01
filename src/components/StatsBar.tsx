import React from 'react';
import { motion } from 'framer-motion';
import { useCounterAnimation } from '../hooks/useCounterAnimation';

function StatCard({
  value,
  label,
  color,
  change,
  icon,
  index,
}: {
  value: number;
  label: string;
  color: string;
  change: string;
  icon: React.ReactNode;
  index: number;
}) {
  const animated = useCounterAnimation(value, 2000);
  const isPositive = !change.startsWith('-');

  return (
    <motion.div
      className="stat-card"
      style={{ '--stat-color': color } as React.CSSProperties}
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
      {/* Animated background gradient on hover */}
      <motion.div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: 'inherit',
          background: `radial-gradient(ellipse at top left, ${color}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />

      <div className="stat-card-icon" style={{ background: `${color}18` }}>
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
      >
        {isPositive ? '▲' : '▼'} {change}
      </motion.div>
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
        icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
      />
      <StatCard
        value={1500}
        label="Торговых точек"
        color="#00d4ff"
        change="План подключения"
        index={1}
        icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>}
      />
      <StatCard
        value={19}
        label="Лучших экипажей"
        color="#a855f7"
        change="Все активны"
        index={2}
        icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
      />
    </div>
  );
}
