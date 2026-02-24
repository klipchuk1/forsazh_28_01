import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
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
  const trackHeight = 470;

  const rowStartX = 120;
  const rowEndX = trackWidth - 80;
  const rowLength = rowEndX - rowStartX;

  const row1Y = 110;
  const row2Y = 240;
  const row3Y = 370;

  // Sorted best-first
  const sorted = [...crews].sort((a, b) => getTrackPosition(b) - getTrackPosition(a));

  const carsRef = useRef<(SVGGElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    carsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el,
        { opacity: 0, scale: 0.3, transformOrigin: 'center center' },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          delay: i * 0.06,
          ease: 'back.out(1.7)',
        }
      );

      gsap.to(el, {
        y: '+=2',
        duration: 1.5 + Math.random() * 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.06 + 0.6,
      });
    });
  }, [sorted.length]);

  const generateZPath = () => {
    const cr = 35;
    let path = `M ${rowStartX} ${row1Y} L ${rowEndX} ${row1Y}`;
    path += ` Q ${rowEndX + cr} ${row1Y + (row2Y - row1Y) / 2}, ${rowEndX} ${row2Y}`;
    path += ` L ${rowStartX} ${row2Y}`;
    path += ` Q ${rowStartX - cr} ${row2Y + (row3Y - row2Y) / 2}, ${rowStartX} ${row3Y}`;
    path += ` L ${rowEndX} ${row3Y}`;
    return path;
  };

  // Offset path for road edges
  const generateEdgePath = (offset: number) => {
    const cr = 35;
    let path = `M ${rowStartX} ${row1Y + offset} L ${rowEndX} ${row1Y + offset}`;
    path += ` Q ${rowEndX + cr + (offset > 0 ? 4 : -4)} ${row1Y + (row2Y - row1Y) / 2 + offset}, ${rowEndX} ${row2Y + offset}`;
    path += ` L ${rowStartX} ${row2Y + offset}`;
    path += ` Q ${rowStartX - cr + (offset > 0 ? 4 : -4)} ${row2Y + (row3Y - row2Y) / 2 + offset}, ${rowStartX} ${row3Y + offset}`;
    path += ` L ${rowEndX} ${row3Y + offset}`;
    return path;
  };

  return (
    <div className="track-container">
      <div className="section-header" style={{ justifyContent: 'center' }}>
        <span className="section-title" style={{
          fontSize: '28px',
          fontWeight: '800',
          background: 'linear-gradient(90deg, #00d4ff, #00ff88, #00d4ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '3px'
        }}>
          ТРАССА ФОРСАЖ
        </span>
      </div>

      <div className="track-svg-wrapper">
        <svg ref={svgRef} viewBox={`0 0 ${trackWidth} ${trackHeight}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Grid pattern for Tron background */}
            <pattern id="tronGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="none" />
              <line x1="0" y1="0" x2="0" y2="40" stroke="#00d4ff08" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="40" y2="0" stroke="#00d4ff08" strokeWidth="0.5" />
            </pattern>

            {/* Road surface gradient */}
            <linearGradient id="roadSurface" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d0d1a" />
              <stop offset="50%" stopColor="#111122" />
              <stop offset="100%" stopColor="#0d0d1a" />
            </linearGradient>

            {/* Neon edge glow */}
            <linearGradient id="neonEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#00ffcc" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>

            {/* Checkpoint portal gradients */}
            <linearGradient id="portal1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="portal2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" />
              <stop offset="50%" stopColor="#ff9966" />
              <stop offset="100%" stopColor="#ff6b35" />
            </linearGradient>
            <linearGradient id="finishGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffd600" />
              <stop offset="50%" stopColor="#ffee88" />
              <stop offset="100%" stopColor="#ffd600" />
            </linearGradient>

            {/* Checkered pattern with neon */}
            <pattern id="checkeredNeon" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="5" height="5" fill="#ffffff" opacity="0.9" />
              <rect x="5" y="0" width="5" height="5" fill="#0a0a15" />
              <rect x="0" y="5" width="5" height="5" fill="#0a0a15" />
              <rect x="5" y="5" width="5" height="5" fill="#ffffff" opacity="0.9" />
            </pattern>

            {/* Glow filters */}
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="neonGlowStrong">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="carGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Tron grid background */}
          <rect width={trackWidth} height={trackHeight} fill="url(#tronGrid)" />

          {/* Road surface - dark asphalt */}
          <path
            d={generateZPath()}
            fill="none"
            stroke="url(#roadSurface)"
            strokeWidth="64"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Road edge - outer neon border */}
          <path
            d={generateEdgePath(30)}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1.5"
            opacity="0.6"
            filter="url(#neonGlow)"
          />
          <path
            d={generateEdgePath(-30)}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1.5"
            opacity="0.6"
            filter="url(#neonGlow)"
          />

          {/* Road edge - inner neon lines */}
          <path
            d={generateEdgePath(24)}
            fill="none"
            stroke="#00d4ff40"
            strokeWidth="0.8"
          />
          <path
            d={generateEdgePath(-24)}
            fill="none"
            stroke="#00d4ff40"
            strokeWidth="0.8"
          />

          {/* Center dashed neon line */}
          <path
            d={generateZPath()}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1.5"
            strokeDasharray="12,18"
            opacity="0.35"
            filter="url(#softGlow)"
          />

          {/* Month labels with glow */}
          <g filter="url(#softGlow)">
            <text x={rowStartX + rowLength / 2} y={row1Y - 48} textAnchor="middle"
              fill="#a855f7" fontSize="15" fontFamily="Orbitron, sans-serif" fontWeight="700" letterSpacing="3">
              ЭТАП 1 — МАРТ
            </text>
            <text x={rowStartX + rowLength / 2} y={row2Y - 48} textAnchor="middle"
              fill="#ff6b35" fontSize="15" fontFamily="Orbitron, sans-serif" fontWeight="700" letterSpacing="3">
              ЭТАП 2 — АПРЕЛЬ
            </text>
            <text x={rowStartX + rowLength / 2} y={row3Y - 48} textAnchor="middle"
              fill="#ffd600" fontSize="15" fontFamily="Orbitron, sans-serif" fontWeight="700" letterSpacing="3">
              ЭТАП 3 — МАЙ
            </text>
          </g>

          {/* START gate - checkered with neon frame */}
          <g>
            {/* Neon frame around start */}
            <rect x={rowStartX - 10} y={row1Y - 34} width="20" height="68" rx="3"
              fill="none" stroke="#00ff88" strokeWidth="1.5" opacity="0.7" filter="url(#neonGlow)" />
            <rect x={rowStartX - 8} y={row1Y - 32} width="16" height="64"
              fill="url(#checkeredNeon)" opacity="0.85" />
            <text x={rowStartX} y={row1Y - 40} textAnchor="middle"
              fill="#00ff88" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700"
              filter="url(#softGlow)">
              START
            </text>
          </g>

          {/* Checkpoint 1 — neon portal at right turn */}
          <g>
            {/* Portal glow background */}
            <ellipse cx={rowEndX + 15} cy={(row1Y + row2Y) / 2} rx="50" ry="45"
              fill="#a855f7" opacity="0.04" />
            {/* Portal arcs */}
            <line x1={rowEndX - 30} y1={(row1Y + row2Y) / 2 - 40} x2={rowEndX - 30} y2={(row1Y + row2Y) / 2 + 40}
              stroke="url(#portal1Grad)" strokeWidth="3" opacity="0.8" filter="url(#neonGlow)" />
            <line x1={rowEndX + 60} y1={(row1Y + row2Y) / 2 - 40} x2={rowEndX + 60} y2={(row1Y + row2Y) / 2 + 40}
              stroke="url(#portal1Grad)" strokeWidth="3" opacity="0.8" filter="url(#neonGlow)" />
            {/* Portal cross beams */}
            <line x1={rowEndX - 30} y1={(row1Y + row2Y) / 2 - 40} x2={rowEndX + 60} y2={(row1Y + row2Y) / 2 - 40}
              stroke="#a855f7" strokeWidth="2" opacity="0.5" filter="url(#softGlow)" />
            <line x1={rowEndX - 30} y1={(row1Y + row2Y) / 2 + 40} x2={rowEndX + 60} y2={(row1Y + row2Y) / 2 + 40}
              stroke="#a855f7" strokeWidth="2" opacity="0.5" filter="url(#softGlow)" />
            {/* Pulsing core */}
            <line x1={rowEndX - 30} y1={(row1Y + row2Y) / 2} x2={rowEndX + 60} y2={(row1Y + row2Y) / 2}
              stroke="#c084fc" strokeWidth="1" opacity="0.4" strokeDasharray="4,6">
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
            </line>
            <text x={rowEndX + 15} y={(row1Y + row2Y) / 2 - 48} textAnchor="middle"
              fill="#a855f7" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700"
              filter="url(#softGlow)">
              ЧЕКПОИНТ 1
            </text>
          </g>

          {/* Checkpoint 2 — neon portal at left turn */}
          <g>
            <ellipse cx={rowStartX - 15} cy={(row2Y + row3Y) / 2} rx="50" ry="45"
              fill="#ff6b35" opacity="0.04" />
            <line x1={rowStartX - 60} y1={(row2Y + row3Y) / 2 - 40} x2={rowStartX - 60} y2={(row2Y + row3Y) / 2 + 40}
              stroke="url(#portal2Grad)" strokeWidth="3" opacity="0.8" filter="url(#neonGlow)" />
            <line x1={rowStartX + 30} y1={(row2Y + row3Y) / 2 - 40} x2={rowStartX + 30} y2={(row2Y + row3Y) / 2 + 40}
              stroke="url(#portal2Grad)" strokeWidth="3" opacity="0.8" filter="url(#neonGlow)" />
            <line x1={rowStartX - 60} y1={(row2Y + row3Y) / 2 - 40} x2={rowStartX + 30} y2={(row2Y + row3Y) / 2 - 40}
              stroke="#ff6b35" strokeWidth="2" opacity="0.5" filter="url(#softGlow)" />
            <line x1={rowStartX - 60} y1={(row2Y + row3Y) / 2 + 40} x2={rowStartX + 30} y2={(row2Y + row3Y) / 2 + 40}
              stroke="#ff6b35" strokeWidth="2" opacity="0.5" filter="url(#softGlow)" />
            <line x1={rowStartX - 60} y1={(row2Y + row3Y) / 2} x2={rowStartX + 30} y2={(row2Y + row3Y) / 2}
              stroke="#ff9966" strokeWidth="1" opacity="0.4" strokeDasharray="4,6">
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
            </line>
            <text x={rowStartX - 15} y={(row2Y + row3Y) / 2 - 48} textAnchor="middle"
              fill="#ff6b35" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700"
              filter="url(#softGlow)">
              ЧЕКПОИНТ 2
            </text>
          </g>

          {/* FINISH — neon portal */}
          <g>
            <ellipse cx={rowEndX} cy={row3Y} rx="30" ry="50"
              fill="#ffd600" opacity="0.05" />
            <line x1={rowEndX} y1={row3Y - 45} x2={rowEndX} y2={row3Y + 45}
              stroke="url(#finishGrad)" strokeWidth="4" filter="url(#neonGlowStrong)" />
            {/* Animated pulse */}
            <line x1={rowEndX - 15} y1={row3Y - 45} x2={rowEndX - 15} y2={row3Y + 45}
              stroke="#ffd600" strokeWidth="1" opacity="0.3">
              <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1={rowEndX + 15} y1={row3Y - 45} x2={rowEndX + 15} y2={row3Y + 45}
              stroke="#ffd600" strokeWidth="1" opacity="0.3">
              <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1.5s" repeatCount="indefinite" />
            </line>
            <text x={rowEndX} y={row3Y + 62} textAnchor="middle"
              fill="#ffd600" fontSize="11" fontFamily="Orbitron, sans-serif" fontWeight="900"
              letterSpacing="3" filter="url(#neonGlow)">
              FINISH
            </text>
          </g>

          {/* ===== CREW CARS ===== */}
          {sorted.map((crew, index) => {
            const cols = 4;
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = rowStartX - 35 - col * 32;
            const y = row1Y - 22 + row * 14;

            const isHovered = hoveredCrew === crew.id;
            const rank = index + 1;

            return (
              <g
                key={crew.id}
                ref={(el) => { carsRef.current[index] = el; }}
                style={{ cursor: 'pointer' }}
                onClick={() => onCrewClick(crew)}
                onMouseEnter={() => setHoveredCrew(crew.id)}
                onMouseLeave={() => setHoveredCrew(null)}
              >
                <rect x={x - 24} y={y - 18} width="48" height="36" fill="transparent" />

                <g transform={`translate(${x}, ${y})`}>
                  {/* Neon ground glow */}
                  <ellipse cx={0} cy={8} rx={14} ry={3}
                    fill={crew.color} opacity={isHovered ? 0.5 : 0.2}
                    filter="url(#softGlow)" />

                  {/* Light trail behind car */}
                  <rect x={-18} y={1} width={8} height={2} rx={1}
                    fill={crew.color} opacity={0.25} filter="url(#softGlow)" />

                  {/* Wheels with neon rim */}
                  <circle cx={-7} cy={4} r={3} fill="#0a0a12" stroke="#333355" strokeWidth="0.8" />
                  <circle cx={7} cy={4} r={3} fill="#0a0a12" stroke="#333355" strokeWidth="0.8" />
                  <circle cx={-7} cy={4} r={1.2} fill={crew.color} opacity="0.4" />
                  <circle cx={7} cy={4} r={1.2} fill={crew.color} opacity="0.4" />

                  {/* Car body */}
                  <g filter={isHovered ? 'url(#carGlow)' : 'url(#softGlow)'}>
                    {/* Main body */}
                    <path
                      d="M-13,3 L-13,0 L-10,-2 L-6,-4 L-2,-5.5 L3,-5.5 L7,-4 L10,-2 L12,0 L13,3 Z"
                      fill={crew.color}
                      opacity={0.95}
                    />
                    {/* Hood accent */}
                    <path
                      d="M-10,-2 L-6,-4 L-2,-5.5 L3,-5.5 L7,-4 L10,-2 L7,-1 L-7,-1 Z"
                      fill={crew.color}
                      opacity={0.7}
                    />
                    {/* Roof / cabin dark */}
                    <path
                      d="M-4,-4.5 L0,-6 L4,-4.5 L6,-3.5 L-5,-3.5 Z"
                      fill="#0a0a15"
                      opacity="0.6"
                    />
                  </g>

                  {/* Windshield - cyan glass */}
                  <path
                    d="M-3,-4.5 L0.5,-5.5 L4,-4 L5.5,-3 L-4,-3 Z"
                    fill="rgba(0,212,255,0.35)"
                  />

                  {/* Neon accent stripe on body */}
                  <line x1={-12} y1={1} x2={12} y2={1}
                    stroke={crew.color} strokeWidth="0.6" opacity="0.6" />

                  {/* Headlights */}
                  <circle cx={12} cy={1} r={1} fill="#ffffff" opacity="0.9" />
                  <circle cx={12} cy={1} r={2.5} fill="#ffffff" opacity="0.15" />

                  {/* Tail light */}
                  <rect x={-14} y={0} width={1.5} height={3} rx={0.5}
                    fill="#ff3366" opacity="0.8" />

                  {/* Rank number */}
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="5"
                    fontFamily="Orbitron, sans-serif"
                    fontWeight="700"
                    opacity="0.95"
                  >
                    {rank}
                  </text>
                </g>

                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 52} y={y - 52} width="104" height="36" rx="8"
                      fill="#0a0a15" stroke={crew.color} strokeWidth="1.5"
                      opacity={0.95} filter="url(#softGlow)"
                    />
                    <text x={x} y={y - 35} textAnchor="middle" fill="#fff"
                      fontSize="9" fontFamily="Rajdhani, sans-serif" fontWeight="600">
                      {crew.teamName}
                    </text>
                    <text x={x} y={y - 22} textAnchor="middle" fill={crew.color}
                      fontSize="9" fontFamily="Orbitron, sans-serif" fontWeight="700">
                      #{rank}
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
