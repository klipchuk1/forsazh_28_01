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

  const trackWidth = 1600;
  const trackHeight = 340;

  const warmupCenterX = 140;
  const warmupCenterY = 140;
  const warmupRadius = 90;

  const rowStartX = 360;
  const rowEndX = trackWidth - 80;
  const rowLength = rowEndX - rowStartX;

  const row1Y = 80;
  const row2Y = 160;
  const row3Y = 240;

  // Sorted best-first
  const sorted = [...crews].sort((a, b) => getTrackPosition(b) - getTrackPosition(a));

  // Generate simple Z-shaped track path (no serpentine)
  const generateZPath = () => {
    const curveRadius = 30;

    // Row 1: straight line left to right
    let path = `M ${rowStartX} ${row1Y} L ${rowEndX} ${row1Y}`;

    // Curve down to row 2
    path += ` Q ${rowEndX + curveRadius} ${row1Y + (row2Y - row1Y) / 2}, ${rowEndX} ${row2Y}`;

    // Row 2: straight line right to left
    path += ` L ${rowStartX} ${row2Y}`;

    // Curve down to row 3
    path += ` Q ${rowStartX - curveRadius} ${row2Y + (row3Y - row2Y) / 2}, ${rowStartX} ${row3Y}`;

    // Row 3: straight line left to right
    path += ` L ${rowEndX} ${row3Y}`;

    return path;
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
            <linearGradient id="checkpoint1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
            <linearGradient id="checkpoint2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" />
              <stop offset="100%" stopColor="#c2410c" />
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
              r={warmupRadius + 20}
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
              strokeWidth="35"
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
              y={warmupCenterY - 12}
              textAnchor="middle"
              fill="#00d4ff"
              fontSize="14"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="700"
              letterSpacing="1.2"
            >
              ФЕВРАЛЬ
            </text>
            <text
              x={warmupCenterX}
              y={warmupCenterY + 8}
              textAnchor="middle"
              fill="#00d4ff90"
              fontSize="11"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="600"
            >
              Прогревочный круг
            </text>
            <text
              x={warmupCenterX}
              y={warmupCenterY + 25}
              textAnchor="middle"
              fill="#00d4ff60"
              fontSize="9"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="500"
            >
              Поиск точек
            </text>
          </g>

          {/* Z-shaped track - simple straight lines */}
          <path
            d={generateZPath()}
            fill="none"
            stroke="url(#trackGrad)"
            strokeWidth="50"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />

          <path
            d={generateZPath()}
            fill="none"
            stroke="#ffffff12"
            strokeWidth="2"
            strokeDasharray="10,15"
          />

          {/* Month labels ABOVE track */}
          <text
            x={rowStartX + rowLength / 2}
            y={row1Y - 45}
            textAnchor="middle"
            fill="#a855f7"
            fontSize="16"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            letterSpacing="2"
          >
            МАРТ
          </text>

          <text
            x={rowStartX + rowLength / 2}
            y={row2Y - 45}
            textAnchor="middle"
            fill="#ff6b35"
            fontSize="16"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            letterSpacing="2"
          >
            АПРЕЛЬ
          </text>

          <text
            x={rowStartX + rowLength / 2}
            y={row3Y - 45}
            textAnchor="middle"
            fill="#ffd600"
            fontSize="16"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            letterSpacing="2"
          >
            МАЙ
          </text>

          {/* Start flag */}
          <g>
            <line x1={rowStartX - 15} y1={row1Y - 25} x2={rowStartX - 15} y2={row1Y + 25} stroke="#ffffff30" strokeWidth="2" />
            <rect x={rowStartX - 13} y={row1Y - 27} width="20" height="12" fill="#ffffff15" rx="2" />
            <text x={rowStartX - 3} y={row1Y - 18} textAnchor="middle" fill="#ffffff60" fontSize="7" fontFamily="Orbitron, sans-serif">START</text>
          </g>

          {/* Checkpoint 1 - vertical line crossing track at end of March */}
          <g filter="url(#glow)">
            <line
              x1={rowEndX}
              y1={row1Y - 40}
              x2={rowEndX}
              y2={row1Y + 40}
              stroke="url(#checkpoint1Grad)"
              strokeWidth="4"
            />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={rowEndX - 4} y={row1Y - 35 + i * 12} width="8" height="8"
                fill={i % 2 === 0 ? '#a855f790' : '#ffffff25'} />
            ))}
            <text x={rowEndX} y={row1Y + 58} textAnchor="middle" fill="#a855f7" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700">CP 1</text>
          </g>

          {/* Checkpoint 2 - vertical line crossing track at end of April */}
          <g filter="url(#glow)">
            <line
              x1={rowStartX}
              y1={row2Y - 40}
              x2={rowStartX}
              y2={row2Y + 40}
              stroke="url(#checkpoint2Grad)"
              strokeWidth="4"
            />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={rowStartX - 4} y={row2Y - 35 + i * 12} width="8" height="8"
                fill={i % 2 === 0 ? '#ff6b3590' : '#ffffff25'} />
            ))}
            <text x={rowStartX} y={row2Y + 58} textAnchor="middle" fill="#ff6b35" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700">CP 2</text>
          </g>

          {/* Finish - vertical line crossing track at end of May */}
          <g filter="url(#glow)">
            <line
              x1={rowEndX}
              y1={row3Y - 40}
              x2={rowEndX}
              y2={row3Y + 40}
              stroke="url(#finishGrad)"
              strokeWidth="4"
            />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} x={rowEndX - 4} y={row3Y - 38 + i * 11} width="8" height="8"
                fill={i % 2 === 0 ? '#ffd60090' : '#ffffff25'} />
            ))}
            <text x={rowEndX} y={row3Y + 58} textAnchor="middle" fill="#ffd600" fontSize="11" fontFamily="Orbitron, sans-serif" fontWeight="700">FINISH</text>
          </g>

          {/* Crew cars - all in warmup zone since we're before start */}
          {sorted.map((crew, index) => {
            // Distribute all cars around warmup circle
            const warmupProgress = index / sorted.length;
            const angle = Math.PI * 0.5 + warmupProgress * Math.PI * 2;
            const radiusOffset = ((index % 3) - 1) * 10;

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
    </div>
  );
}
