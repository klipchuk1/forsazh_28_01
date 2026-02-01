import React from 'react';
import type { Crew } from '../data/types';
import { useCounterAnimation } from '../hooks/useCounterAnimation';
import iconsSprite from '../assets/icons-metrics.png';

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
        {icon}
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
        icon={<div style={{ width: '18px', height: '18px', backgroundImage: `url(${iconsSprite})`, backgroundSize: '54px 18px', backgroundPosition: '0px 0' }} />}
      />
      <StatCard
        value={totalSales}
        label="Объём продаж"
        color="#00d4ff"
        change={`+12.3% vs.прошл.`}
        delayClass="animate-delay-2"
        icon={<div style={{ width: '18px', height: '18px', backgroundImage: `url(${iconsSprite})`, backgroundSize: '54px 18px', backgroundPosition: '-18px 0' }} />}
      />
      <StatCard
        value={totalSku}
        label="Уникальных СКЮ"
        color="#a855f7"
        change={`+8 новых`}
        delayClass="animate-delay-3"
        icon={<div style={{ width: '18px', height: '18px', backgroundImage: `url(${iconsSprite})`, backgroundSize: '54px 18px', backgroundPosition: '-36px 0' }} />}
      />
      <StatCard
        value={19}
        label="Экипажей гонки"
        color="#00ff88"
        change="Все активны"
        delayClass="animate-delay-4"
        icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#00ff88" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
      />
    </div>
  );
}
