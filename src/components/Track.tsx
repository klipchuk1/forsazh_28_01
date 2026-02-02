import { useState } from 'react';
import type { Crew } from '../data/types';

interface TrackProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

// Computes car position on track (0..1.15) from segmentScores.
// Warmup is circular loop on the left, then 3 laps on serpentine track.
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
function getCarPositionOnPath(progress: number, trackWidth: number): { x: number; y: number } {
  const warmupCenterX = 180;
  const warmupCenterY = 140;
  const warmupRadius = 80;

  const mainTrackStartX = 340;
  const mainTrackEndX = trackWidth - 60;
  const trackLength = mainTrackEndX - mainTrackStartX;

  if (progress < 0.25) {
    // Warmup zone - circular loop (counterclockwise from bottom)
    const warmupProgress = progress / 0.25;
    const angle = Math.PI * 0.5 + warmupProgress * Math.PI * 2; // Start at bottom, go counterclockwise

    return {
      x: warmupCenterX + Math.cos(angle) * warmupRadius,
      y: warmupCenterY + Math.sin(angle) * warmupRadius,
    };
  } else {
    // Main serpentine track (3 laps) - very winding like a snake
    const mainProgress = (progress - 0.25) / 0.75;
    const x = mainTrackStartX + trackLength * mainProgress;

    // Serpentine pattern: multiple tight S-curves
    const centerY = 140;
    const amplitude = 50; // Large amplitude for dramatic curves
    const frequency = 5; // More waves = more serpentine

    const y = centerY + Math.sin(mainProgress * Math.PI * frequency) * amplitude;

    return { x, y };
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
  const trackHeight = 300;

  const warmupCenterX = 180;
  const warmupCenterY = 140;
  const warmupRadius = 80;

  const mainTrackStartX = 340;
  const mainTrackEndX = trackWidth - 60;
  const trackLength = mainTrackEndX - mainTrackStartX;

  // Segment boundaries for main track (after warmup)
  const cp1X = mainTrackStartX + trackLength * 0.333;
  const cp2X = mainTrackStartX + trackLength * 0.666;

  // Sorted best-first (furthest right = best)
  const sorted = [...crews].sort((a, b) => getTrackPosition(b) - getTrackPosition(a));

  // Generate serpentine path for main track
  const generateSerpentinePath = () => {
    const points = [];
    const steps = 100;
    const centerY = 140;
    const amplitude = 50;
    const frequency = 5;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = mainTrackStartX + trackLength * progress;
      const y = centerY + Math.sin(progress * Math.PI * frequency) * amplitude;
      points.push(`${x},${y}`);
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
              r={warmupRadius + 25}
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
              strokeWidth="35"
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

            {/* Text in the center of warmup circle */}
            <text
              x={warmupCenterX}
              y={warmupCenterY - 15}
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
              y={warmupCenterY + 5}
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
              y={warmupCenterY + 20}
              textAnchor="middle"
              fill="#00d4ff60"
              fontSize="9"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="500"
            >
              Поиск точек
            </text>
          </g>

          {/* Main serpentine track path - very winding */}
          <path
            d={generateSerpentinePath()}
            fill="none"
            stroke="url(#trackGrad)"
            strokeWidth="60"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Track center line (dashed) */}
          <path
            d={generateSerpentinePath()}
            fill="none"
            stroke="#ffffff15"
            strokeWidth="2"
            strokeDasharray="8,12"
          />

          {/* Checkpoint markers on serpentine track */}
          <g>
            <rect x={cp1X - 40} y={30} width="80" height="22" rx="6" fill="#a855f710" stroke="#a855f735" strokeWidth="1" />
            <text x={cp1X} y={46} textAnchor="middle" fill="#a855f7" fontSize="10" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.5">МАРТ</text>
          </g>

          <g>
            <rect x={cp2X - 40} y={30} width="80" height="22" rx="6" fill="#ff6b3510" stroke="#ff6b3535" strokeWidth="1" />
            <text x={cp2X} y={46} textAnchor="middle" fill="#ff6b35" fontSize="10" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.5">АПРЕЛЬ</text>
          </g>

          {/* Start flag at warmup entry */}
          <g>
            <line x1={mainTrackStartX - 25} y1={115} x2={mainTrackStartX - 25} y2={165} stroke="#ffffff30" strokeWidth="2" />
            <rect x={mainTrackStartX - 23} y={113} width="22" height="12" fill="#ffffff15" rx="2" />
            <text x={mainTrackStartX - 12} y={122} textAnchor="middle" fill="#ffffff60" fontSize="8" fontFamily="Orbitron, sans-serif">START</text>
          </g>

          {/* Finish flag */}
          <g filter="url(#glow)">
            <line x1={mainTrackEndX} y1={100} x2={mainTrackEndX} y2={180} stroke="url(#finishGrad)" strokeWidth="3" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={mainTrackEndX + 3} y={100 + i * 10} width="10" height="10"
                fill={i % 2 === 0 ? '#ffd60080' : '#ffffff20'} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={`b${i}`} x={mainTrackEndX + 13} y={100 + i * 10} width="10" height="10"
                fill={i % 2 === 1 ? '#ffd60080' : '#ffffff20'} />
            ))}
            <text x={mainTrackEndX + 18} y={195} textAnchor="middle" fill="#ffd600" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700">FINISH</text>
            <text x={mainTrackEndX + 18} y={90} textAnchor="middle" fill="#ffd60080" fontSize="9" fontFamily="Rajdhani, sans-serif" fontWeight="600">МАЙ</text>
          </g>

          {/* Crew cars */}
          {sorted.map((crew, index) => {
            const position = getTrackPosition(crew);
            const { x, y } = getCarPositionOnPath(position, trackWidth);
            const isHovered = hoveredCrew === crew.id;
            const rank = index + 1;

            // Vertical stagger for overlapping cars
            const yOffset = ((index % 6) - 2.5) * 7;
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

          {/* Progress markers below track */}
          <g>
            <text x={warmupCenterX} y={warmupCenterY + warmupRadius + 35} textAnchor="middle" fill="#00d4ff50" fontSize="8" fontFamily="Rajdhani, sans-serif">0-25%</text>
            <text x={cp1X}   y={260} textAnchor="middle" fill="#a855f750" fontSize="8" fontFamily="Rajdhani, sans-serif">50%</text>
            <text x={cp2X}   y={260} textAnchor="middle" fill="#ff6b3550" fontSize="8" fontFamily="Rajdhani, sans-serif">75%</text>
            <text x={mainTrackEndX} y={260} textAnchor="middle" fill="#ffd60050" fontSize="8" fontFamily="Rajdhani, sans-serif">100%</text>
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
