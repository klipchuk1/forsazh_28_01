import React from 'react';
import type { Crew } from '../data/types';

interface LeaderboardProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

function getScore(crew: Crew): number {
  const cp = crew.metrics.connectedPoints;
  const sv = crew.metrics.salesVolume;
  const sk = crew.metrics.skuCount;
  return Math.round(
    (cp.fact / cp.target) * 50 +
    (sv.fact / sv.target) * 30 +
    (sk.fact / sk.target) * 20
  );
}

function getProgressPercent(crew: Crew): number {
  return Math.round((crew.metrics.connectedPoints.fact / crew.metrics.connectedPoints.target) * 100);
}

export default function Leaderboard({ crews, onCrewClick }: LeaderboardProps) {
  const sortedByScore = [...crews].sort((a, b) => getScore(b) - getScore(a));
  const sortedByPoints = [...crews].sort((a, b) =>
    b.metrics.connectedPoints.fact - a.metrics.connectedPoints.fact
  );

  const renderRow = (crew: Crew, rank: number, showPercent: boolean) => {
    const pct = showPercent ? getProgressPercent(crew) : getScore(crew);
    let barColor = crew.color;
    let displayValue = showPercent ? `${pct}%` : `${pct}pts`;

    let rankClass = 'rank-default';
    if (rank === 1) rankClass = 'rank-1';
    else if (rank === 2) rankClass = 'rank-2';
    else if (rank === 3) rankClass = 'rank-3';

    const barWidth = Math.min(pct / (showPercent ? 120 : 120), 1) * 100;

    return (
      <div
        key={crew.id}
        className={`leaderboard-row ${rank <= 3 ? 'top-3' : ''}`}
        onClick={() => onCrewClick(crew)}
      >
        <div className={`rank-badge ${rankClass}`}>
          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
        </div>
        <div className="leaderboard-team-info">
          <div className="leaderboard-team-name" style={{ color: crew.color }}>{crew.teamName}</div>
          <div className="leaderboard-team-members">
            {crew.driver.name.split(' ')[0]} & {crew.navigator.name.split(' ')[0]}
          </div>
        </div>
        <div className="leaderboard-progress-wrap">
          <div className="leaderboard-progress-bar">
            <div
              className="leaderboard-progress-fill"
              style={{
                width: `${barWidth}%`,
                background: barColor,
                boxShadow: `0 0 6px ${barColor}60`,
              }}
            />
          </div>
          <span className="leaderboard-percent" style={{ color: barColor }}>{displayValue}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="leaderboard-grid">
      <div className="leaderboard-panel">
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <span className="section-title">🏆 Рейтинг по Overall</span>
        </div>
        <div className="leaderboard-table">
          {sortedByScore.slice(0, 10).map((crew, i) => renderRow(crew, i + 1, false))}
        </div>
      </div>

      <div className="leaderboard-panel">
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <span className="section-title">🎯 Рейтинг по точкам</span>
        </div>
        <div className="leaderboard-table">
          {sortedByPoints.slice(0, 10).map((crew, i) => renderRow(crew, i + 1, true))}
        </div>
      </div>
    </div>
  );
}
