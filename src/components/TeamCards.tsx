import React from 'react';
import type { Crew } from '../data/types';

interface TeamCardsProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

function getBarStatus(fact: number, target: number): 'on-track' | 'behind' | 'ahead' {
  const ratio = fact / target;
  if (ratio >= 1) return 'ahead';
  if (ratio >= 0.7) return 'on-track';
  return 'behind';
}

function getRank(crews: Crew[], crewId: number): number {
  const sorted = [...crews].sort((a, b) => {
    const scoreA = (a.metrics.connectedPoints.fact / a.metrics.connectedPoints.target);
    const scoreB = (b.metrics.connectedPoints.fact / b.metrics.connectedPoints.target);
    return scoreB - scoreA;
  });
  return sorted.findIndex((c) => c.id === crewId) + 1;
}

export default function TeamCards({ crews, onCrewClick }: TeamCardsProps) {
  return (
    <div>
      <div className="section-header">
        <span className="section-title">🚗 Экипажи</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
          {crews.length} экипажей
        </span>
      </div>
      <div className="team-cards-grid">
        {crews.map((crew, index) => {
          const rank = getRank(crews, crew.id);
          const pct = Math.round((crew.metrics.connectedPoints.fact / crew.metrics.connectedPoints.target) * 100);
          const salesPct = Math.round((crew.metrics.salesVolume.fact / crew.metrics.salesVolume.target) * 100);
          const skuPct = Math.round((crew.metrics.skuCount.fact / crew.metrics.skuCount.target) * 100);

          return (
            <div
              key={crew.id}
              className={`team-card animate-fade-in`}
              style={{
                animationDelay: `${index * 0.05}s`,
                '--card-color': crew.color,
                '--card-glow': crew.glowColor,
              } as React.CSSProperties}
              onClick={() => onCrewClick(crew)}
            >
              <div className="team-card-header">
                <div className="team-card-avatars">
                  <img className="team-card-avatar" src={crew.driver.avatar} alt={crew.driver.name} />
                  <img className="team-card-avatar" src={crew.navigator.avatar} alt={crew.navigator.name} />
                </div>
                <div className="team-card-info">
                  <div className="team-card-name">{crew.teamName}</div>
                  <div className="team-card-members">
                    🚗 {crew.driver.name.split(' ')[0]} · 🧭 {crew.navigator.name.split(' ')[0]}
                  </div>
                </div>
                <div className="team-card-rank">#{rank}</div>
              </div>

              <div className="team-card-metrics">
                <div className="metric-mini">
                  <div className="metric-mini-value">{crew.metrics.connectedPoints.fact}</div>
                  <div className="metric-mini-label">Точки</div>
                  <div className="metric-mini-bar">
                    <div
                      className={`metric-mini-bar-fill ${getBarStatus(crew.metrics.connectedPoints.fact, crew.metrics.connectedPoints.target)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="metric-mini">
                  <div className="metric-mini-value">{(crew.metrics.salesVolume.fact / 1000).toFixed(1)}k</div>
                  <div className="metric-mini-label">Продажи</div>
                  <div className="metric-mini-bar">
                    <div
                      className={`metric-mini-bar-fill ${getBarStatus(crew.metrics.salesVolume.fact, crew.metrics.salesVolume.target)}`}
                      style={{ width: `${Math.min(salesPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="metric-mini">
                  <div className="metric-mini-value">{crew.metrics.skuCount.fact}</div>
                  <div className="metric-mini-label">СКЮ</div>
                  <div className="metric-mini-bar">
                    <div
                      className={`metric-mini-bar-fill ${getBarStatus(crew.metrics.skuCount.fact, crew.metrics.skuCount.target)}`}
                      style={{ width: `${Math.min(skuPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
