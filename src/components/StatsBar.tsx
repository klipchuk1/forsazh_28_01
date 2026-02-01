import React from 'react';
import { useCounterAnimation } from '../hooks/useCounterAnimation';

function StatCard({
  value,
  label,
  color,
  change,
  icon,
  delayClass,
}: {
  value: number;
  label: string;
  color: string;
  change: string;
  icon: React.ReactNode;
  delayClass: string;
}) {
  const animated = useCounterAnimation(value, 2000);
  const isPositive = !change.startsWith('-');

  return (
    <div
      className={`stat-card animate-fade-in ${delayClass}`}
      style={{ '--stat-color': color } as React.CSSProperties}
    >
      <div className="stat-card-icon" style={{ background: `${color}18` }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
          {icon}
        </svg>
      </div>
      <div className="stat-card-value">{animated.toLocaleString('ru-RU')}</div>
      <div className="stat-card-label">{label}</div>
      <div className={`stat-card-change ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '▲' : '▼'} {change}
      </div>
    </div>
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
        delayClass="animate-delay-1"
        icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
      />
      <StatCard
        value={1500}
        label="Торговых точек"
        color="#00d4ff"
        change="План подключения"
        delayClass="animate-delay-2"
        icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>}
      />
      <StatCard
        value={19}
        label="Лучших экипажей"
        color="#a855f7"
        change="Все активны"
        delayClass="animate-delay-3"
        icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
      />
    </div>
  );
}
