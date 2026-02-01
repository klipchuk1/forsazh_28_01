import { useState } from 'react';
import type { Crew } from '../data/types';

interface TrackProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

// Computes car position on track (0..1.15) from segmentScores.
// Each of the 4 segments occupies 25% of track length.
// Segments fill left-to-right: a segment must reach 100% before the next begins.
// When the backend supplies real per-segment points, just populate crew.segmentScores
// and cars will move automatically — no other logic needs to change.
function getTrackPosition(crew: Crew): number {
  const segments = [
    crew.segmentScores.warmup,
    crew.segmentScores.lap1,
    crew.segmentScores.lap2,
    crew.segmentScores.lap3,
  ];

  let position = 0;
  const segmentSize = 0.25;
  let allComplete = true;

  for (const segment of segments) {
    const completion = segment.target > 0 ? segment.fact / segment.target : 0;
    if (completion < 1.0) {
      position += completion * segmentSize;
      allComplete = false;
      break;
    }
    position += segmentSize;
  }

  // Allow overshoot past finish for over-achievers on the last segment
  if (allComplete) {
    const last = segments[segments.length - 1];
    if (last.target > 0 && last.fact > last.target) {
      position += ((last.fact - last.target) / last.target) * segmentSize;
    }
  }

  return Math.min(position, 1.15);
}

function getCurrentSegmentLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  if (now < new Date(year, 1, 16)) return 'До старта';
  if (now < new Date(year, 2, 1))  return 'Прогревочный круг';
  if (now < new Date(year, 3, 1))  return 'Круг 1';
  if (now < new Date(year, 4, 1))  return 'Круг 2';
  if (now < new Date(year, 5, 1))  return 'Круг 3';
  return 'Завершено';
}

export default function Track({ crews, onCrewClick }: TrackProps) {
  const [hoveredCrew, setHoveredCrew] = useState<number | null>(null);

  const trackWidth = 1100;
  const trackHeight = 240;
  const startX = 60;
  const endX = trackWidth - 60;
  const trackLength = endX - startX;

  // Segment boundaries at 25 / 50 / 75 %
  const cp1X = startX + trackLength * 0.25;
  const cp2X = startX + trackLength * 0.50;
  const cp3X = startX + trackLength * 0.75;

  // Sorted best-first (furthest right = best)
  const sorted = [...crews].sort((a, b) => getTrackPosition(b) - getTrackPosition(a));

  return (
    <div className="track-container">
      <div className="section-header">
        <span className="section-title">🏁 Трасса Форсаж — 4 отрезка</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
          {getCurrentSegmentLabel()}
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
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowIntense">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track background */}
          <rect x={startX - 20} y={55} width={trackLength + 40} height={40} rx="20" fill="url(#trackGrad)" />

          {/* Subtle segment colour tints */}
          <rect x={startX}  y={58} width={trackLength * 0.25} height={34} fill="#00d4ff" opacity={0.03} />
          <rect x={cp1X}    y={58} width={trackLength * 0.25} height={34} fill="#a855f7" opacity={0.035} />
          <rect x={cp2X}    y={58} width={trackLength * 0.25} height={34} fill="#ff6b35" opacity={0.035} />
          <rect x={cp3X}    y={58} width={trackLength * 0.25} height={34} fill="#ffd600" opacity={0.03} />

          {/* Lane dashes */}
          <line x1={startX} y1={75} x2={endX} y2={75} stroke="#ffffff08" strokeWidth="1" strokeDasharray="8,12" />
          <line x1={startX} y1={75} x2={endX} y2={75} stroke="#ffffff15" strokeWidth="2" />

          {/* Checkpoint 1 — конец февраля (25%) */}
          <g>
            <line x1={cp1X} y1={38} x2={cp1X} y2={115} stroke="#00d4ff25" strokeWidth="1" strokeDasharray="4,4" />
            <rect x={cp1X - 30} y={28} width="60" height="18" rx="4" fill="#00d4ff10" stroke="#00d4ff35" strokeWidth="1" />
            <text x={cp1X} y={41} textAnchor="middle" fill="#00d4ff" fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.5">ФЕВР.</text>
          </g>

          {/* Checkpoint 2 — конец марта (50%) */}
          <g>
            <line x1={cp2X} y1={38} x2={cp2X} y2={115} stroke="#a855f725" strokeWidth="1" strokeDasharray="4,4" />
            <rect x={cp2X - 30} y={28} width="60" height="18" rx="4" fill="#a855f710" stroke="#a855f735" strokeWidth="1" />
            <text x={cp2X} y={41} textAnchor="middle" fill="#a855f7" fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.5">МАРТ</text>
          </g>

          {/* Checkpoint 3 — конец апреля (75%) */}
          <g>
            <line x1={cp3X} y1={38} x2={cp3X} y2={115} stroke="#ff6b3525" strokeWidth="1" strokeDasharray="4,4" />
            <rect x={cp3X - 30} y={28} width="60" height="18" rx="4" fill="#ff6b3510" stroke="#ff6b3535" strokeWidth="1" />
            <text x={cp3X} y={41} textAnchor="middle" fill="#ff6b35" fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.5">АПРЕЛЬ</text>
          </g>

          {/* Start flag */}
          <g>
            <line x1={startX} y1={50} x2={startX} y2={100} stroke="#ffffff30" strokeWidth="2" />
            <rect x={startX + 2} y={48} width="22" height="12" fill="#ffffff15" rx="2" />
            <text x={startX + 13} y={57} textAnchor="middle" fill="#ffffff60" fontSize="8" fontFamily="Orbitron, sans-serif">START</text>
          </g>

          {/* Finish flag */}
          <g filter="url(#glow)">
            <line x1={endX} y1={38} x2={endX} y2={105} stroke="url(#finishGrad)" strokeWidth="3" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={endX + 3} y={40 + i * 7} width="7" height="7"
                fill={i % 2 === 0 ? '#ffd60080' : '#ffffff20'} />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <rect key={`b${i}`} x={endX + 10} y={40 + i * 7} width="7" height="7"
                fill={i % 2 === 1 ? '#ffd60080' : '#ffffff20'} />
            ))}
            <text x={endX + 13} y={120} textAnchor="middle" fill="#ffd600" fontSize="8" fontFamily="Orbitron, sans-serif" fontWeight="700">FINISH</text>
          </g>

          {/* Crew cars */}
          {sorted.map((crew, index) => {
            const position = getTrackPosition(crew);
            const x = Math.min(startX + trackLength * position, endX + 15);
            const isHovered = hoveredCrew === crew.id;
            const rank = index + 1;

            // 3-row vertical stagger to avoid overlap
            const yOffset = (index % 3) * 12 - 12;
            const y = 75 + yOffset;

            return (
              <g
                key={crew.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onCrewClick(crew)}
                onMouseEnter={() => setHoveredCrew(crew.id)}
                onMouseLeave={() => setHoveredCrew(null)}
              >
                {/* Exhaust trail behind car */}
                {position > 0.01 && (
                  <g opacity={isHovered ? 0.7 : 0.35}>
                    <rect x={x - 17} y={y - 1}   width={4}   height={1}   rx={0.5}  fill={crew.color} opacity={0.4} />
                    <rect x={x - 22} y={y - 0.3} width={3}   height={0.7} rx={0.35} fill={crew.color} opacity={0.2} />
                    <rect x={x - 16} y={y + 0.8} width={2.5} height={0.7} rx={0.35} fill={crew.color} opacity={0.25} />
                  </g>
                )}

                {/* Car group */}
                <g transform={`translate(${x}, ${y})`}>
                  {/* Ground shadow */}
                  <ellipse cx={0} cy={5} rx={12} ry={2} fill={crew.color} opacity={isHovered ? 0.35 : 0.15} />

                  {/* Wheels (rendered before body so body covers wheel-well area) */}
                  <circle cx={-6} cy={2} r={2.8} fill="#0d0d12" />
                  <circle cx={ 6} cy={2} r={2.8} fill="#0d0d12" />
                  <circle cx={-6} cy={2} r={1.2} fill="#2a2a35" />
                  <circle cx={ 6} cy={2} r={1.2} fill="#2a2a35" />

                  {/* Body + spoiler with glow */}
                  <g filter={isHovered ? 'url(#glowIntense)' : 'url(#glow)'}>
                    {/* Main body silhouette:
                        flat bottom, raised cabin in the middle, sloped hood & rear */}
                    <path
                      d="M-11,2 L-11,-0.5 L-7,-2 L-3,-4 L2,-4 L6,-2 L9,-0.5 L11,2 Z"
                      fill={crew.color}
                      opacity={0.92}
                    />
                    {/* Rear spoiler */}
                    <rect x={-12.5} y={-2} width={2} height={3} rx={0.5} fill={crew.color} />
                  </g>

                  {/* Windshield (trapezoid inside cabin) */}
                  <path
                    d="M-2,-3.5 L1.5,-3.5 L4,-2 L-3.5,-2 Z"
                    fill="rgba(130,210,255,0.3)"
                  />

                  {/* Exhaust flame at rear */}
                  <rect x={-14} y={0} width={1.8} height={1.5} rx={0.6} fill="rgba(255,100,30,0.6)" />

                  {/* Rank number on body */}
                  <text
                    x={0}
                    y={0.5}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="5.5"
                    fontFamily="Orbitron, sans-serif"
                    fontWeight="700"
                  >
                    {rank}
                  </text>
                </g>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 48}
                      y={y - 48}
                      width="96"
                      height="34"
                      rx="6"
                      fill="#1a1a2e"
                      stroke={crew.color}
                      strokeWidth="1"
                      opacity={0.95}
                    />
                    <text x={x} y={y - 32} textAnchor="middle" fill="#fff" fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="600">
                      {crew.teamName}
                    </text>
                    <text x={x} y={y - 20} textAnchor="middle" fill={crew.color} fontSize="8" fontFamily="Orbitron, sans-serif" fontWeight="700">
                      {Math.round(position * 100)}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Progress markers */}
          <g>
            <text x={startX} y={120} textAnchor="middle" fill="#ffffff25" fontSize="8" fontFamily="Rajdhani, sans-serif">0%</text>
            <text x={cp1X}   y={120} textAnchor="middle" fill="#00d4ff50" fontSize="8" fontFamily="Rajdhani, sans-serif">25%</text>
            <text x={cp2X}   y={120} textAnchor="middle" fill="#a855f750" fontSize="8" fontFamily="Rajdhani, sans-serif">50%</text>
            <text x={cp3X}   y={120} textAnchor="middle" fill="#ff6b3550" fontSize="8" fontFamily="Rajdhani, sans-serif">75%</text>
            <text x={endX}   y={120} textAnchor="middle" fill="#ffd60050" fontSize="8" fontFamily="Rajdhani, sans-serif">100%</text>
          </g>
        </svg>
      </div>

      <div className="checkpoint-labels">
        <span className="checkpoint-label">🏁 Старт</span>
        <span className="checkpoint-label">❄️ Прогр. круг</span>
        <span className="checkpoint-label">🏎️ Круг 1</span>
        <span className="checkpoint-label">🏎️ Круг 2</span>
        <span className="checkpoint-label">🏆 Круг 3 — Финиш</span>
      </div>
    </div>
  );
}
