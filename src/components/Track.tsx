import { useState } from 'react';
import type { Crew } from '../data/types';

interface TrackProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

// Computes car position on track (0..1.15) from segmentScores.
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

  const trackWidth = 1500;
  const trackHeight = 340;

  const warmupCenterX = 180;
  const warmupCenterY = 140;
  const warmupRadius = 70;

  const rowStartX = 320;
  const rowEndX = trackWidth - 80;
  const rowLength = rowEndX - rowStartX;

  const row1Y = 80;
  const row2Y = 160;
  const row3Y = 240;

  const amplitude = 25;
  const frequency = 4;

  // Sorted best-first
  const sorted = [...crews].sort((a, b) => getTrackPosition(b) - getTrackPosition(a));

  // Generate ONE continuous serpentine path through all 3 rows
  const generateContinuousPath = () => {
    const points = [];
    const steps = 50;

    // Row 1: Март (left to right)
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = rowStartX + rowLength * progress;
      const waveOffset = Math.sin(progress * Math.PI * frequency) * amplitude;
      points.push(`${x},${row1Y + waveOffset}`);
    }

    // Smooth curve transition from row1 end to row2 start
    const curveSteps = 15;
    for (let i = 1; i <= curveSteps; i++) {
      const t = i / curveSteps;
      const x = rowEndX - (rowEndX - rowEndX) * t * 0.3 + 30 * Math.sin(t * Math.PI);
      const y = row1Y + (row2Y - row1Y) * t;
      points.push(`${x},${y}`);
    }

    // Row 2: Апрель (right to left)
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = rowEndX - rowLength * progress;
      const waveOffset = Math.sin(progress * Math.PI * frequency) * amplitude;
      points.push(`${x},${row2Y + waveOffset}`);
    }

    // Smooth curve transition from row2 end to row3 start
    for (let i = 1; i <= curveSteps; i++) {
      const t = i / curveSteps;
      const x = rowStartX + (rowStartX - rowStartX) * t * 0.3 - 30 * Math.sin(t * Math.PI);
      const y = row2Y + (row3Y - row2Y) * t;
      points.push(`${x},${y}`);
    }

    // Row 3: Май (left to right)
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = rowStartX + rowLength * progress;
      const waveOffset = Math.sin(progress * Math.PI * frequency) * amplitude;
      points.push(`${x},${row3Y + waveOffset}`);
    }

    return `M ${points.join(' L ')}`;
  };

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

          {/* Warmup circular track */}
          <g>
            <circle
              cx={warmupCenterX}
              cy={warmupCenterY}
              r={warmupRadius + 18}
              fill="none"
              stroke="#00d4ff20"
              strokeWidth="2"
              strokeDasharray="8,4"
            />

            <circle
              cx={warmupCenterX}
              cy={warmupCenterY}
              r={warmupRadius}
              fill="none"
              stroke="url(#trackGrad)"
              strokeWidth="30"
              opacity="0.6"
            />

            <circle
              cx={warmupCenterX}
              cy={warmupCenterY}
              r={warmupRadius}
              fill="none"
              stroke="#ffffff15"
              strokeWidth="2"
              strokeDasharray="6,8"
            />

            <text
              x={warmupCenterX}
              y={warmupCenterY - 10}
              textAnchor="middle"
              fill="#00d4ff"
              fontSize="13"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="700"
              letterSpacing="1"
            >
              ФЕВРАЛЬ
            </text>
            <text
              x={warmupCenterX}
              y={warmupCenterY + 8}
              textAnchor="middle"
              fill="#00d4ff90"
              fontSize="10"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="600"
            >
              Прогревочный круг
            </text>
            <text
              x={warmupCenterX}
              y={warmupCenterY + 23}
              textAnchor="middle"
              fill="#00d4ff60"
              fontSize="8"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="500"
            >
              Поиск точек
            </text>
          </g>

          {/* ONE continuous serpentine track */}
          <path
            d={generateContinuousPath()}
            fill="none"
            stroke="url(#trackGrad)"
            strokeWidth="50"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />

          <path
            d={generateContinuousPath()}
            fill="none"
            stroke="#ffffff12"
            strokeWidth="2"
            strokeDasharray="10,15"
          />

          {/* Month labels ABOVE track */}
          <text
            x={rowStartX + rowLength / 2}
            y={row1Y - 40}
            textAnchor="middle"
            fill="#a855f7"
            fontSize="14"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            letterSpacing="1.5"
          >
            МАРТ
          </text>

          <text
            x={rowStartX + rowLength / 2}
            y={row2Y - 40}
            textAnchor="middle"
            fill="#ff6b35"
            fontSize="14"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            letterSpacing="1.5"
          >
            АПРЕЛЬ
          </text>

          <text
            x={rowStartX + rowLength / 2}
            y={row3Y - 40}
            textAnchor="middle"
            fill="#ffd600"
            fontSize="14"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            letterSpacing="1.5"
          >
            МАЙ
          </text>

          {/* Start flag */}
          <g>
            <line x1={rowStartX - 15} y1={row1Y - 25} x2={rowStartX - 15} y2={row1Y + 25} stroke="#ffffff30" strokeWidth="2" />
            <rect x={rowStartX - 13} y={row1Y - 27} width="20" height="12" fill="#ffffff15" rx="2" />
            <text x={rowStartX - 3} y={row1Y - 18} textAnchor="middle" fill="#ffffff60" fontSize="7" fontFamily="Orbitron, sans-serif">START</text>
          </g>

          {/* Finish flag */}
          <g filter="url(#glow)">
            <line x1={rowEndX + 25} y1={row3Y - 35} x2={rowEndX + 25} y2={row3Y + 35} stroke="url(#finishGrad)" strokeWidth="3" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={rowEndX + 28} y={row3Y - 33 + i * 11} width="9" height="9"
                fill={i % 2 === 0 ? '#ffd60090' : '#ffffff25'} />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={`b${i}`} x={rowEndX + 37} y={row3Y - 33 + i * 11} width="9" height="9"
                fill={i % 2 === 1 ? '#ffd60090' : '#ffffff25'} />
            ))}
            <text x={rowEndX + 42} y={row3Y + 55} textAnchor="middle" fill="#ffd600" fontSize="12" fontFamily="Orbitron, sans-serif" fontWeight="700">FINISH</text>
          </g>

          {/* Crew cars - all in warmup zone since we're before start */}
          {sorted.map((crew, index) => {
            // Distribute all cars around warmup circle
            const warmupProgress = index / sorted.length;
            const angle = Math.PI * 0.5 + warmupProgress * Math.PI * 2;
            const radiusOffset = ((index % 3) - 1) * 8;

            const x = warmupCenterX + Math.cos(angle) * (warmupRadius + radiusOffset);
            const y = warmupCenterY + Math.sin(angle) * (warmupRadius + radiusOffset);

            const isHovered = hoveredCrew === crew.id;
            const rank = index + 1;

            return (
              <g
                key={crew.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onCrewClick(crew)}
                onMouseEnter={() => setHoveredCrew(crew.id)}
                onMouseLeave={() => setHoveredCrew(null)}
              >
                <rect x={x - 22} y={y - 22} width="44" height="44" fill="transparent" />

                <g transform={`translate(${x}, ${y})`}>
                  <ellipse cx={0} cy={5} rx={12} ry={2} fill={crew.color} opacity={isHovered ? 0.35 : 0.15} />

                  <circle cx={-6} cy={2} r={2.8} fill="#0d0d12" />
                  <circle cx={ 6} cy={2} r={2.8} fill="#0d0d12" />
                  <circle cx={-6} cy={2} r={1.2} fill="#2a2a35" />
                  <circle cx={ 6} cy={2} r={1.2} fill="#2a2a35" />

                  <g filter={isHovered ? 'url(#glowIntense)' : 'url(#glow)'}>
                    <path
                      d="M-11,2 L-11,-0.5 L-7,-2 L-3,-4 L2,-4 L6,-2 L9,-0.5 L11,2 Z"
                      fill={crew.color}
                      opacity={0.92}
                    />
                    <rect x={-12.5} y={-2} width={2} height={3} rx={0.5} fill={crew.color} />
                  </g>

                  <path
                    d="M-2,-3.5 L1.5,-3.5 L4,-2 L-3.5,-2 Z"
                    fill="rgba(130,210,255,0.3)"
                  />

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
                      Прогрев
                    </text>
                  </g>
                )}
              </g>
            );
          })}
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
