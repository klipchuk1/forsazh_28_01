import React from 'react';
import type { Crew } from '../data/types';
import { useCounterAnimation } from '../hooks/useCounterAnimation';

interface StatsBarProps {
  crews: Crew[];
}

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

export default function StatsBar({ crews }: StatsBarProps) {
  const totalConnected = crews.reduce((s, c) => s + c.metrics.connectedPoints.fact, 0);
  const totalTarget = crews.reduce((s, c) => s + c.metrics.connectedPoints.target, 0);
  const totalSales = crews.reduce((s, c) => s + c.metrics.salesVolume.fact, 0);
  const totalSku = crews.reduce((s, c) => s + c.metrics.skuCount.fact, 0);
  const overallPercent = Math.round((totalConnected / totalTarget) * 100);

  return (
    <div className="stats-bar">
      <StatCard
        value={totalConnected}
        label="Подключено точек"
        color="#ff3366"
        change={`${overallPercent}% от плана`}
        delayClass="animate-delay-1"
        icon={<><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></>}
      />
      <StatCard
        value={totalSales}
        label="Объём продаж"
        color="#00d4ff"
        change={`+12.3% vs.прошл.`}
        delayClass="animate-delay-2"
        icon={<><path d="M23 6l-9 5.5L9 4 1 8.5" /><path d="M17 6h6v6" /></>}
      />
      <StatCard
        value={totalSku}
        label="Уникальных СКЮ"
        color="#a855f7"
        change={`+8 новых`}
        delayClass="animate-delay-3"
        icon={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>}
      />
      <StatCard
        value={19}
        label="Экипажей гонки"
        color="#00ff88"
        change="Все активны"
        delayClass="animate-delay-4"
        icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
      />
    </div>
  );
}
