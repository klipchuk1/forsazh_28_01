import type { Crew } from '../data/types';

interface LeaderboardProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

function getOverallPct(crew: Crew): number {
  if (crew.finishTarget <= 0) return 0;
  return Math.round((crew.totalScore / crew.finishTarget) * 100);
}

export default function Leaderboard({ crews, onCrewClick }: LeaderboardProps) {
  const sortedByScore = [...crews].sort((a, b) => b.totalScore - a.totalScore);

  const renderRow = (crew: Crew, rank: number) => {
    const pct = getOverallPct(crew);

    let rankClass = 'rank-default';
    if (rank === 1) rankClass = 'rank-1';
    else if (rank === 2) rankClass = 'rank-2';
    else if (rank === 3) rankClass = 'rank-3';

    const barWidth = Math.min(pct / 120, 1) * 100;

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
                background: crew.color,
                boxShadow: `0 0 6px ${crew.color}60`,
              }}
            />
          </div>
          <span className="leaderboard-percent" style={{ color: crew.color }}>{crew.totalScore}pts</span>
        </div>
      </div>
    );
  };

  return (
    <div className="leaderboard-grid">
      <div className="leaderboard-panel">
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <span className="section-title">🏆 Рейтинг экипажей</span>
        </div>
        <div className="leaderboard-table">
          {sortedByScore.map((crew, i) => renderRow(crew, i + 1))}
        </div>
      </div>
    </div>
  );
}
