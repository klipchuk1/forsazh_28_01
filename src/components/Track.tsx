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

// Computes X,Y position along the track path
// Layout: Warmup circle, then 3 horizontal serpentine rows (Март L→R, Апрель R→L, Май L→R)
function getCarPositionOnPath(progress: number, trackWidth: number): { x: number; y: number } {
  const warmupCenterX = 180;
  const warmupCenterY = 100;
  const warmupRadius = 70;

  const rowStartX = 340;
  const rowEndX = trackWidth - 80;
  const rowLength = rowEndX - rowStartX;

  const row1Y = 80;  // Март
  const row2Y = 160; // Апрель
  const row3Y = 240; // Май

  if (progress < 0.25) {
    // Warmup zone - circular loop (counterclockwise from bottom)
    const warmupProgress = progress / 0.25;
    const angle = Math.PI * 0.5 + warmupProgress * Math.PI * 2;

    return {
      x: warmupCenterX + Math.cos(angle) * warmupRadius,
      y: warmupCenterY + Math.sin(angle) * warmupRadius,
    };
  } else if (progress < 0.5) {
    // Март (Lap 1): left to right, row 1
    const lapProgress = (progress - 0.25) / 0.25;
    const x = rowStartX + rowLength * lapProgress;
    const waveOffset = Math.sin(lapProgress * Math.PI * 3) * 15;
    return { x, y: row1Y + waveOffset };
  } else if (progress < 0.75) {
    // Апрель (Lap 2): right to left, row 2
    const lapProgress = (progress - 0.5) / 0.25;
    const x = rowEndX - rowLength * lapProgress; // Reverse direction
    const waveOffset = Math.sin(lapProgress * Math.PI * 3) * 15;
    return { x, y: row2Y + waveOffset };
  } else {
    // Май (Lap 3): left to right, row 3
    const lapProgress = (progress - 0.75) / 0.25;
    const x = rowStartX + rowLength * lapProgress;
    const waveOffset = Math.sin(lapProgress * Math.PI * 3) * 15;
    return { x, y: row3Y + waveOffset };
  }
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
  const trackHeight = 320;

  const warmupCenterX = 180;
  const warmupCenterY = 100;
  const warmupRadius = 70;

  const rowStartX = 340;
  const rowEndX = trackWidth - 80;
  const rowLength = rowEndX - rowStartX;

  const row1Y = 80;
  const row2Y = 160;
  const row3Y = 240;

  // Sorted best-first (furthest right = best)
  const sorted = [...crews].sort((a, b) => getTrackPosition(b) - getTrackPosition(a));

  // Generate serpentine path for a row
  const generateRowPath = (startX: number, endX: number, y: number, reverse: boolean) => {
    const points = [];
    const steps = 60;
    const length = Math.abs(endX - startX);

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = reverse ? endX - length * progress : startX + length * progress;
      const waveOffset = Math.sin(progress * Math.PI * 3) * 15;
      points.push(`${x},${y + waveOffset}`);
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

          {/* Warmup circular track (left side) */}
          <g>
            {/* Outer circle border */}
            <circle
              cx={warmupCenterX}
              cy={warmupCenterY}
              r={warmupRadius + 20}
              fill="none"
              stroke="#00d4ff30"
              strokeWidth="2"
              strokeDasharray="8,4"
            />

            {/* Track circle (thick stroke) */}
            <circle
              cx={warmupCenterX}
              cy={warmupCenterY}
              r={warmupRadius}
              fill="none"
              stroke="url(#trackGrad)"
              strokeWidth="30"
              opacity="0.5"
            />

            {/* Center line on circle */}
            <circle
              cx={warmupCenterX}
              cy={warmupCenterY}
              r={warmupRadius}
              fill="none"
              stroke="#ffffff15"
              strokeWidth="2"
              strokeDasharray="6,8"
            />

            {/* Text in the center */}
            <text
              x={warmupCenterX}
              y={warmupCenterY - 10}
              textAnchor="middle"
              fill="#00d4ff"
              fontSize="12"
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
              fontSize="9"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="600"
            >
              Прогревочный круг
            </text>
            <text
              x={warmupCenterX}
              y={warmupCenterY + 22}
              textAnchor="middle"
              fill="#00d4ff60"
              fontSize="8"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="500"
            >
              Поиск точек
            </text>
          </g>

          {/* Row 1: МАРТ (left to right) */}
          <g>
            <path
              d={generateRowPath(rowStartX, rowEndX, row1Y, false)}
              fill="none"
              stroke="url(#trackGrad)"
              strokeWidth="50"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d={generateRowPath(rowStartX, rowEndX, row1Y, false)}
              fill="none"
              stroke="#ffffff15"
              strokeWidth="2"
              strokeDasharray="8,12"
            />
            {/* Month label */}
            <rect x={rowStartX + rowLength / 2 - 45} y={row1Y - 35} width="90" height="24" rx="6" fill="#a855f710" stroke="#a855f735" strokeWidth="1" />
            <text x={rowStartX + rowLength / 2} y={row1Y - 16} textAnchor="middle" fill="#a855f7" fontSize="11" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.5">МАРТ</text>
            {/* Direction arrow */}
            <path d={`M ${rowStartX + 20} ${row1Y - 25} L ${rowStartX + 50} ${row1Y - 25}`} stroke="#a855f750" strokeWidth="2" markerEnd="url(#arrowMart)" />
            <defs>
              <marker id="arrowMart" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#a855f7" />
              </marker>
            </defs>
          </g>

          {/* Transition arrow: Row 1 → Row 2 */}
          <g>
            <path
              d={`M ${rowEndX + 20} ${row1Y + 20} Q ${rowEndX + 50} ${(row1Y + row2Y) / 2}, ${rowEndX + 20} ${row2Y - 20}`}
              fill="none"
              stroke="#ff6b3550"
              strokeWidth="3"
              strokeDasharray="6,6"
              markerEnd="url(#arrowTransition1)"
            />
            <defs>
              <marker id="arrowTransition1" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#ff6b35" />
              </marker>
            </defs>
          </g>

          {/* Row 2: АПРЕЛЬ (right to left - reverse) */}
          <g>
            <path
              d={generateRowPath(rowStartX, rowEndX, row2Y, true)}
              fill="none"
              stroke="url(#trackGrad)"
              strokeWidth="50"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d={generateRowPath(rowStartX, rowEndX, row2Y, true)}
              fill="none"
              stroke="#ffffff15"
              strokeWidth="2"
              strokeDasharray="8,12"
            />
            {/* Month label */}
            <rect x={rowStartX + rowLength / 2 - 45} y={row2Y - 35} width="90" height="24" rx="6" fill="#ff6b3510" stroke="#ff6b3535" strokeWidth="1" />
            <text x={rowStartX + rowLength / 2} y={row2Y - 16} textAnchor="middle" fill="#ff6b35" fontSize="11" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.5">АПРЕЛЬ</text>
            {/* Direction arrow (reverse) */}
            <path d={`M ${rowEndX - 20} ${row2Y - 25} L ${rowEndX - 50} ${row2Y - 25}`} stroke="#ff6b3550" strokeWidth="2" markerEnd="url(#arrowApril)" />
            <defs>
              <marker id="arrowApril" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#ff6b35" />
              </marker>
            </defs>
          </g>

          {/* Transition arrow: Row 2 → Row 3 */}
          <g>
            <path
              d={`M ${rowStartX - 20} ${row2Y + 20} Q ${rowStartX - 50} ${(row2Y + row3Y) / 2}, ${rowStartX - 20} ${row3Y - 20}`}
              fill="none"
              stroke="#ffd60050"
              strokeWidth="3"
              strokeDasharray="6,6"
              markerEnd="url(#arrowTransition2)"
            />
            <defs>
              <marker id="arrowTransition2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#ffd600" />
              </marker>
            </defs>
          </g>

          {/* Row 3: МАЙ (left to right) */}
          <g>
            <path
              d={generateRowPath(rowStartX, rowEndX, row3Y, false)}
              fill="none"
              stroke="url(#trackGrad)"
              strokeWidth="50"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d={generateRowPath(rowStartX, rowEndX, row3Y, false)}
              fill="none"
              stroke="#ffffff15"
              strokeWidth="2"
              strokeDasharray="8,12"
            />
            {/* Month label */}
            <rect x={rowStartX + rowLength / 2 - 45} y={row3Y - 35} width="90" height="24" rx="6" fill="#ffd60010" stroke="#ffd60035" strokeWidth="1" />
            <text x={rowStartX + rowLength / 2} y={row3Y - 16} textAnchor="middle" fill="#ffd600" fontSize="11" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.5">МАЙ</text>
            {/* Direction arrow */}
            <path d={`M ${rowStartX + 20} ${row3Y - 25} L ${rowStartX + 50} ${row3Y - 25}`} stroke="#ffd60050" strokeWidth="2" markerEnd="url(#arrowMay)" />
            <defs>
              <marker id="arrowMay" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#ffd600" />
              </marker>
            </defs>
          </g>

          {/* Start flag at warmup exit */}
          <g>
            <line x1={rowStartX - 25} y1={row1Y - 20} x2={rowStartX - 25} y2={row1Y + 20} stroke="#ffffff30" strokeWidth="2" />
            <rect x={rowStartX - 23} y={row1Y - 22} width="22" height="12" fill="#ffffff15" rx="2" />
            <text x={rowStartX - 12} y={row1Y - 13} textAnchor="middle" fill="#ffffff60" fontSize="8" fontFamily="Orbitron, sans-serif">START</text>
          </g>

          {/* Finish flag at end of row 3 */}
          <g filter="url(#glow)">
            <line x1={rowEndX + 30} y1={row3Y - 30} x2={rowEndX + 30} y2={row3Y + 30} stroke="url(#finishGrad)" strokeWidth="3" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={rowEndX + 33} y={row3Y - 28 + i * 12} width="10" height="10"
                fill={i % 2 === 0 ? '#ffd60080' : '#ffffff20'} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={`b${i}`} x={rowEndX + 43} y={row3Y - 28 + i * 12} width="10" height="10"
                fill={i % 2 === 1 ? '#ffd60080' : '#ffffff20'} />
            ))}
            <text x={rowEndX + 48} y={row3Y + 48} textAnchor="middle" fill="#ffd600" fontSize="11" fontFamily="Orbitron, sans-serif" fontWeight="700">FINISH</text>
          </g>

          {/* Crew cars */}
          {sorted.map((crew, index) => {
            const position = getTrackPosition(crew);
            const { x, y } = getCarPositionOnPath(position, trackWidth);
            const isHovered = hoveredCrew === crew.id;
            const rank = index + 1;

            // Vertical stagger for overlapping cars
            const yOffset = ((index % 5) - 2) * 6;
            const finalY = y + yOffset;

            return (
              <g
                key={crew.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onCrewClick(crew)}
                onMouseEnter={() => setHoveredCrew(crew.id)}
                onMouseLeave={() => setHoveredCrew(null)}
              >
                {/* Touch hit area (44×44 min target) */}
                <rect x={x - 22} y={finalY - 22} width="44" height="44" fill="transparent" />

                {/* Exhaust trail behind car */}
                {position > 0.01 && (
                  <g opacity={isHovered ? 0.7 : 0.35}>
                    <rect x={x - 17} y={finalY - 1}   width={4}   height={1}   rx={0.5}  fill={crew.color} opacity={0.4} />
                    <rect x={x - 22} y={finalY - 0.3} width={3}   height={0.7} rx={0.35} fill={crew.color} opacity={0.2} />
                    <rect x={x - 16} y={finalY + 0.8} width={2.5} height={0.7} rx={0.35} fill={crew.color} opacity={0.25} />
                  </g>
                )}

                {/* Car group */}
                <g transform={`translate(${x}, ${finalY})`}>
                  {/* Ground shadow */}
                  <ellipse cx={0} cy={5} rx={12} ry={2} fill={crew.color} opacity={isHovered ? 0.35 : 0.15} />

                  {/* Wheels */}
                  <circle cx={-6} cy={2} r={2.8} fill="#0d0d12" />
                  <circle cx={ 6} cy={2} r={2.8} fill="#0d0d12" />
                  <circle cx={-6} cy={2} r={1.2} fill="#2a2a35" />
                  <circle cx={ 6} cy={2} r={1.2} fill="#2a2a35" />

                  {/* Body + spoiler with glow */}
                  <g filter={isHovered ? 'url(#glowIntense)' : 'url(#glow)'}>
                    <path
                      d="M-11,2 L-11,-0.5 L-7,-2 L-3,-4 L2,-4 L6,-2 L9,-0.5 L11,2 Z"
                      fill={crew.color}
                      opacity={0.92}
                    />
                    <rect x={-12.5} y={-2} width={2} height={3} rx={0.5} fill={crew.color} />
                  </g>

                  {/* Windshield */}
                  <path
                    d="M-2,-3.5 L1.5,-3.5 L4,-2 L-3.5,-2 Z"
                    fill="rgba(130,210,255,0.3)"
                  />

                  {/* Exhaust flame */}
                  <rect x={-14} y={0} width={1.8} height={1.5} rx={0.6} fill="rgba(255,100,30,0.6)" />

                  {/* Rank number */}
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
                      y={finalY - 48}
                      width="96"
                      height="34"
                      rx="6"
                      fill="#1a1a2e"
                      stroke={crew.color}
                      strokeWidth="1"
                      opacity={0.95}
                    />
                    <text x={x} y={finalY - 32} textAnchor="middle" fill="#fff" fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="600">
                      {crew.teamName}
                    </text>
                    <text x={x} y={finalY - 20} textAnchor="middle" fill={crew.color} fontSize="8" fontFamily="Orbitron, sans-serif" fontWeight="700">
                      {Math.round(position * 100)}%
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
