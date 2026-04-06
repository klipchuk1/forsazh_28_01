import type { Crew, SegmentScores } from '../data/types';

interface LeaderboardProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

type SegmentKey = keyof SegmentScores;

const SEGMENT_MONTHS: { key: SegmentKey; month: number; label: string }[] = [
  { key: 'warmup', month: 2, label: 'Февраль' },
  { key: 'lap1', month: 3, label: 'Март' },
  { key: 'lap2', month: 4, label: 'Апрель' },
  { key: 'lap3', month: 5, label: 'Май' },
];

function getCurrentSegment(): { key: SegmentKey; label: string } {
  const month = new Date().getMonth() + 1; // 1-based
  const match = SEGMENT_MONTHS.find(s => s.month === month);
  return match ?? SEGMENT_MONTHS[SEGMENT_MONTHS.length - 1];
}

function getMonthlyScore(crew: Crew, segmentKey: SegmentKey): number {
  return crew.segmentScores[segmentKey]?.fact ?? 0;
}

export default function Leaderboard({ crews, onCrewClick }: LeaderboardProps) {
  const currentSegment = getCurrentSegment();

  const sortedOverall = [...crews].sort((a, b) => b.totalScore - a.totalScore);
  const sortedMonthly = [...crews].sort((a, b) =>
    getMonthlyScore(b, currentSegment.key) - getMonthlyScore(a, currentSegment.key)
  );

  const maxOverall = sortedOverall.length > 0 ? sortedOverall[0].totalScore : 1;
  const maxMonthly = sortedMonthly.length > 0 ? getMonthlyScore(sortedMonthly[0], currentSegment.key) : 1;

  const renderRow = (crew: Crew, rank: number, score: number, maxScore: number) => {
    let rankClass = 'rank-default';
    if (rank === 1) rankClass = 'rank-1';
    else if (rank === 2) rankClass = 'rank-2';
    else if (rank === 3) rankClass = 'rank-3';

    const barWidth = maxScore > 0 ? Math.min(score / maxScore, 1) * 100 : 0;

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
          <div className="leaderboard-team-name" style={{ color: crew.color }}>{crew.teamName}{crew.branch ? <span style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '0.85em' }}> | {crew.branch}</span> : ''}</div>
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
          <span className="leaderboard-percent" style={{ color: crew.color }}>{score}pts</span>
        </div>
      </div>
    );
  };

  return (
    <div className="leaderboard-grid">
      <div className="leaderboard-panel">
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <span className="section-title">🏆 За всю гонку</span>
        </div>
        <div className="leaderboard-table">
          {sortedOverall.map((crew, i) => renderRow(crew, i + 1, crew.totalScore, maxOverall))}
        </div>
      </div>

      <div className="leaderboard-panel">
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <span className="section-title">📅 За {currentSegment.label.toLowerCase()}</span>
        </div>
        <div className="leaderboard-table">
          {sortedMonthly.map((crew, i) =>
            renderRow(crew, i + 1, getMonthlyScore(crew, currentSegment.key), maxMonthly)
          )}
        </div>
      </div>
    </div>
  );
}
