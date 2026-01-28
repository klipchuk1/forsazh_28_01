import { useState } from 'react';
import type { Crew } from '../data/types';

interface TrackProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

function getProgressPercent(crew: Crew): number {
  const cp = crew.metrics.connectedPoints;
  return Math.min(Math.round((cp.fact / cp.target) * 100), 120);
}

export default function Track({ crews, onCrewClick }: TrackProps) {
  const [hoveredCrew, setHoveredCrew] = useState<number | null>(null);

  const trackWidth = 1100;
  const trackHeight = 220;
  const startX = 60;
  const endX = trackWidth - 60;
  const trackLength = endX - startX;

  // Checkpoints
  const cp1X = startX + trackLength * 0.33;
  const cp2X = startX + trackLength * 0.66;

  // Position crews on track by progress
  const sorted = [...crews].sort((a, b) => getProgressPercent(b) - getProgressPercent(a));

  return (
    <div className="track-container">
      <div className="section-header">
        <span className="section-title">🏁 Трасса Форсаж — 3 месяца</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
          Неделя 8 / 12
        </span>
      </div>

      <div className="track-svg-wrapper">
        <svg viewBox={`0 0 ${trackWidth} ${trackHeight}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="50%" stopColor="#0f0f1a" />
              <stop offset="100%" stopColor="#1a1a2e" />
            </linearGradient>
            <linearGradient id="finishGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffd600" />
              <stop offset="100%" stopColor="#ff6600" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Intense glow */}
            <filter id="glowIntense">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track background */}
          <rect x={startX - 20} y={60} width={trackLength + 40} height={30} rx="15" fill="url(#trackGrad)" />

          {/* Track lane lines */}
          <line x1={startX} y1={75} x2={endX} y2={75} stroke="#ffffff08" strokeWidth="1" strokeDasharray="8,12" />

          {/* Track main line */}
          <line x1={startX} y1={75} x2={endX} y2={75} stroke="#ffffff15" strokeWidth="2" />

          {/* Checkpoint 1 */}
          <g>
            <line x1={cp1X} y1={40} x2={cp1X} y2={110} stroke="#00d4ff33" strokeWidth="1" strokeDasharray="4,4" />
            <rect x={cp1X - 28} y={32} width="56" height="18" rx="4" fill="#00d4ff15" stroke="#00d4ff40" strokeWidth="1" />
            <text x={cp1X} y={44} textAnchor="middle" fill="#00d4ff" fontSize="9" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="1">CP-1</text>
          </g>

          {/* Checkpoint 2 */}
          <g>
            <line x1={cp2X} y1={40} x2={cp2X} y2={110} stroke="#a855f733" strokeWidth="1" strokeDasharray="4,4" />
            <rect x={cp2X - 28} y={32} width="56" height="18" rx="4" fill="#a855f715" stroke="#a855f740" strokeWidth="1" />
            <text x={cp2X} y={44} textAnchor="middle" fill="#a855f7" fontSize="9" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="1">CP-2</text>
          </g>

          {/* Start flag */}
          <g>
            <line x1={startX} y1={50} x2={startX} y2={100} stroke="#ffffff30" strokeWidth="2" />
            <rect x={startX + 2} y={48} width="22" height="12" fill="#ffffff15" rx="2" />
            <text x={startX + 13} y={57} textAnchor="middle" fill="#ffffff60" fontSize="8" fontFamily="Orbitron, sans-serif">START</text>
          </g>

          {/* Finish flag */}
          <g filter="url(#glow)">
            <line x1={endX} y1={40} x2={endX} y2={105} stroke="url(#finishGrad)" strokeWidth="3" />
            {/* Checkered flag pattern */}
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={endX + 3} y={42 + i * 7} width="7" height="7"
                fill={i % 2 === 0 ? '#ffd60080' : '#ffffff20'} />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <rect key={`b${i}`} x={endX + 10} y={42 + i * 7} width="7" height="7"
                fill={i % 2 === 1 ? '#ffd60080' : '#ffffff20'} />
            ))}
            <text x={endX + 13} y={122} textAnchor="middle" fill="#ffd600" fontSize="8" fontFamily="Orbitron, sans-serif" fontWeight="700">FINISH</text>
          </g>

          {/* Crew cars on track */}
          {sorted.map((crew, index) => {
            const progress = Math.min(getProgressPercent(crew) / 100, 1.15);
            const x = startX + trackLength * progress;
            const isHovered = hoveredCrew === crew.id;
            const rank = index + 1;

            // Stagger y positions to avoid overlap
            const yOffset = (index % 3) * 11 - 11;
            const y = 68 + yOffset;

            return (
              <g
                key={crew.id}
                style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
                onClick={() => onCrewClick(crew)}
                onMouseEnter={() => setHoveredCrew(crew.id)}
                onMouseLeave={() => setHoveredCrew(null)}
              >
                {/* Glow behind car */}
                <ellipse cx={x} cy={y + 6} rx={12} ry={4} fill={crew.color} opacity={isHovered ? 0.4 : 0.2} />

                {/* Car body */}
                <rect
                  x={x - 10}
                  y={y - 2}
                  width="20"
                  height="8"
                  rx="4"
                  fill={crew.color}
                  filter={isHovered ? 'url(#glowIntense)' : 'url(#glow)'}
                  opacity={0.9}
                />

                {/* Car number */}
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="6"
                  fontFamily="Orbitron, sans-serif"
                  fontWeight="700"
                >
                  {rank}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 45}
                      y={y - 38}
                      width="90"
                      height="32"
                      rx="6"
                      fill="#1a1a2e"
                      stroke={crew.color}
                      strokeWidth="1"
                      opacity={0.95}
                    />
                    <text x={x} y={y - 22} textAnchor="middle" fill="#fff" fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="600">
                      {crew.teamName}
                    </text>
                    <text x={x} y={y - 12} textAnchor="middle" fill={crew.color} fontSize="8" fontFamily="Orbitron, sans-serif" fontWeight="700">
                      {getProgressPercent(crew)}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Progress markers at bottom */}
          <g>
            <text x={startX} y={120} textAnchor="middle" fill="#ffffff25" fontSize="8" fontFamily="Rajdhani, sans-serif">0%</text>
            <text x={cp1X} y={120} textAnchor="middle" fill="#00d4ff50" fontSize="8" fontFamily="Rajdhani, sans-serif">33%</text>
            <text x={cp2X} y={120} textAnchor="middle" fill="#a855f750" fontSize="8" fontFamily="Rajdhani, sans-serif">66%</text>
            <text x={endX} y={120} textAnchor="middle" fill="#ffd60050" fontSize="8" fontFamily="Rajdhani, sans-serif">100%</text>
          </g>
        </svg>
      </div>

      <div className="checkpoint-labels">
        <span className="checkpoint-label">🏁 Старт</span>
        <span className="checkpoint-label">⚡ Месяц 1</span>
        <span className="checkpoint-label">🔥 Месяц 2</span>
        <span className="checkpoint-label">🏆 Финиш — Месяц 3</span>
      </div>
    </div>
  );
}
