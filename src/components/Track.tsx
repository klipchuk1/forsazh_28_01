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

export default function Track({ crews, onCrewClick }: TrackProps) {
  const [hoveredCrew, setHoveredCrew] = useState<number | null>(null);

  const trackWidth = 1600;
  const trackHeight = 450;

  const warmupCenterX = 140;
  const warmupCenterY = 200;
  const warmupRadius = 120;

  const rowStartX = 360;
  const rowEndX = trackWidth - 80;
  const rowLength = rowEndX - rowStartX;

  const row1Y = 100;
  const row2Y = 225;
  const row3Y = 350;

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
      <div className="section-header" style={{ justifyContent: 'center' }}>
        <span className="section-title">Трасса Форсаж — 3 месяца</span>
      </div>

      <div className="track-svg-wrapper">
        <svg viewBox={`0 0 ${trackWidth} ${trackHeight}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2d2d4a" />
              <stop offset="50%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#2d2d4a" />
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
            <pattern id="checkeredPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="6" height="6" fill="#ffffff" />
              <rect x="6" y="0" width="6" height="6" fill="#000000" />
              <rect x="0" y="6" width="6" height="6" fill="#000000" />
              <rect x="6" y="6" width="6" height="6" fill="#ffffff" />
            </pattern>
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
              y={warmupCenterY + 30}
              textAnchor="middle"
              fill="#FFD600"
              fontSize="15"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="800"
              letterSpacing="1.5"
            >
              Поиск точек
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </text>
          </g>

          {/* Z-shaped track - simple straight lines */}
          <path
            d={generateZPath()}
            fill="none"
            stroke="url(#trackGrad)"
            strokeWidth="60"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          <path
            d={generateZPath()}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />

          <path
            d={generateZPath()}
            fill="none"
            stroke="#ffffff25"
            strokeWidth="2"
            strokeDasharray="10,15"
          />

          {/* Month labels ABOVE track */}
          <text
            x={rowStartX + rowLength / 2}
            y={row1Y - 50}
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
            y={row2Y - 50}
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
            y={row3Y - 50}
            textAnchor="middle"
            fill="#ffd600"
            fontSize="16"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            letterSpacing="2"
          >
            МАЙ
          </text>

          {/* Start line - checkered like Formula 1 */}
          <g>
            <rect
              x={rowStartX - 8}
              y={row1Y - 35}
              width="16"
              height="70"
              fill="url(#checkeredPattern)"
              opacity="0.95"
            />
            <rect
              x={rowStartX - 8}
              y={row1Y - 35}
              width="16"
              height="70"
              fill="none"
              stroke="#ffffff40"
              strokeWidth="1"
            />
            <text
              x={rowStartX}
              y={row1Y - 42}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontFamily="Orbitron, sans-serif"
              fontWeight="700"
            >
              START
            </text>
          </g>

          {/* Checkpoint 1 - horizontal line at right turn between row1 and row2 */}
          <g filter="url(#glow)">
            <line
              x1={rowEndX - 45}
              y1={(row1Y + row2Y) / 2}
              x2={rowEndX + 75}
              y2={(row1Y + row2Y) / 2}
              stroke="url(#checkpoint1Grad)"
              strokeWidth="4"
            />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <rect key={i} x={rowEndX - 45 + i * 12} y={(row1Y + row2Y) / 2 - 4} width="8" height="8"
                fill={i % 2 === 0 ? '#a855f790' : '#ffffff25'} />
            ))}
            <text x={rowEndX + 15} y={(row1Y + row2Y) / 2 - 15} textAnchor="middle" fill="#a855f7" fontSize="11" fontFamily="Orbitron, sans-serif" fontWeight="700">Чекпоинт Этап 1</text>
          </g>

          {/* Checkpoint 2 - horizontal line at left turn between row2 and row3 */}
          <g filter="url(#glow)">
            <line
              x1={rowStartX - 75}
              y1={(row2Y + row3Y) / 2}
              x2={rowStartX + 45}
              y2={(row2Y + row3Y) / 2}
              stroke="url(#checkpoint2Grad)"
              strokeWidth="4"
            />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <rect key={i} x={rowStartX - 75 + i * 12} y={(row2Y + row3Y) / 2 - 4} width="8" height="8"
                fill={i % 2 === 0 ? '#ff6b3590' : '#ffffff25'} />
            ))}
            <text x={rowStartX - 15} y={(row2Y + row3Y) / 2 - 15} textAnchor="middle" fill="#ff6b35" fontSize="11" fontFamily="Orbitron, sans-serif" fontWeight="700">Чекпоинт Этап 2</text>
          </g>

          {/* Finish - vertical line crossing track at end of May */}
          <g filter="url(#glow)">
            <line
              x1={rowEndX}
              y1={row3Y - 45}
              x2={rowEndX}
              y2={row3Y + 45}
              stroke="url(#finishGrad)"
              strokeWidth="4"
            />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect key={i} x={rowEndX - 4} y={row3Y - 42 + i * 11} width="8" height="8"
                fill={i % 2 === 0 ? '#ffd60090' : '#ffffff25'} />
            ))}
            <text x={rowEndX} y={row3Y + 63} textAnchor="middle" fill="#ffd600" fontSize="11" fontFamily="Orbitron, sans-serif" fontWeight="700">FINISH</text>
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
