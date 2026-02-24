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

  const W = 1600;
  const H = 600;

  const sx = 140;       // row start X
  const ex = W - 100;   // row end X

  const r1 = 130;       // row 1 Y center
  const r2 = 310;       // row 2 Y center
  const r3 = 490;       // row 3 Y center
  const roadW = 70;     // half road width

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
        { opacity: 0, scale: 0, transformOrigin: 'center center' },
        { opacity: 1, scale: 1, duration: 0.5, delay: 0.3 + i * 0.05, ease: 'back.out(1.4)' }
      );
      // Subtle pulse glow instead of floating (no position shift = no jittery numbers)
      gsap.to(el, {
        opacity: 0.85, duration: 1.2 + Math.random() * 0.6,
        repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.8 + i * 0.05,
      });
    });
  }, [sorted.length]);

  // Z-path for center line
  const zPath = (() => {
    const cr = 40;
    let p = `M ${sx} ${r1} L ${ex} ${r1}`;
    p += ` Q ${ex + cr} ${(r1 + r2) / 2}, ${ex} ${r2}`;
    p += ` L ${sx} ${r2}`;
    p += ` Q ${sx - cr} ${(r2 + r3) / 2}, ${sx} ${r3}`;
    p += ` L ${ex} ${r3}`;
    return p;
  })();

  return (
    <div className="track-container">
      <div className="section-header" style={{ justifyContent: 'center' }}>
        <span className="section-title" style={{
          fontSize: '26px', fontWeight: '800',
          background: 'linear-gradient(90deg, #00d4ff, #00ff88, #00d4ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '3px',
        }}>
          ТРАССА ФОРСАЖ
        </span>
      </div>

      <div className="track-svg-wrapper">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#fff" opacity="0.85" />
              <rect x="5" width="5" height="5" fill="#111" />
              <rect y="5" width="5" height="5" fill="#111" />
              <rect x="5" y="5" width="5" height="5" fill="#fff" opacity="0.85" />
            </pattern>
          </defs>

          {/* ========== ROAD ========== */}
          {/* Road surface — wide dark band */}
          <path d={zPath} fill="none" stroke="#161625" strokeWidth={roadW * 2}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Road edge lines — subtle white */}
          <path d={zPath} fill="none" stroke="#ffffff18" strokeWidth={roadW * 2 + 4}
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={zPath} fill="none" stroke="#161625" strokeWidth={roadW * 2}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Kerb stripes — red/white on edges */}
          <path d={zPath} fill="none" stroke="#ff336640" strokeWidth={roadW * 2 + 2}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="8,8" />

          {/* Center dashed line */}
          <path d={zPath} fill="none" stroke="#ffffff30" strokeWidth="2"
            strokeDasharray="14,20" />

          {/* ========== LABELS ========== */}
          <text x={sx + (ex - sx) / 2} y={r1 - 42} textAnchor="middle"
            fill="#a855f7" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9">
            ЭТАП 1 — МАРТ
          </text>
          <text x={sx + (ex - sx) / 2} y={r2 - 42} textAnchor="middle"
            fill="#ff6b35" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9">
            ЭТАП 2 — АПРЕЛЬ
          </text>
          <text x={sx + (ex - sx) / 2} y={r3 - 42} textAnchor="middle"
            fill="#ffd600" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9">
            ЭТАП 3 — МАЙ
          </text>

          {/* ========== START ========== */}
          <g>
            <rect x={sx - 6} y={r1 - roadW} width="12" height={roadW * 2}
              fill="url(#checker)" opacity="0.8" />
            <text x={sx} y={r1 - roadW - 8} textAnchor="middle"
              fill="#00ff88" fontSize="10" fontFamily="Orbitron, sans-serif"
              fontWeight="700" filter="url(#glow)">
              START
            </text>
          </g>

          {/* ========== CHECKPOINT 1 — right turn ========== */}
          <g>
            <line x1={ex - 10} y1={(r1 + r2) / 2 - roadW - 5}
              x2={ex + 40} y2={(r1 + r2) / 2 - roadW - 5}
              stroke="#a855f7" strokeWidth="3" opacity="0.7" filter="url(#glow)" />
            <line x1={ex - 10} y1={(r1 + r2) / 2 + roadW + 5}
              x2={ex + 40} y2={(r1 + r2) / 2 + roadW + 5}
              stroke="#a855f7" strokeWidth="3" opacity="0.7" filter="url(#glow)" />
            {/* Connecting verticals */}
            <line x1={ex - 10} y1={(r1 + r2) / 2 - roadW - 5}
              x2={ex - 10} y2={(r1 + r2) / 2 + roadW + 5}
              stroke="#a855f7" strokeWidth="2" opacity="0.5" />
            <line x1={ex + 40} y1={(r1 + r2) / 2 - roadW - 5}
              x2={ex + 40} y2={(r1 + r2) / 2 + roadW + 5}
              stroke="#a855f7" strokeWidth="2" opacity="0.5" />
            <text x={ex + 15} y={(r1 + r2) / 2 - roadW - 14} textAnchor="middle"
              fill="#a855f7" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700">
              ЧЕКПОИНТ 1
            </text>
          </g>

          {/* ========== CHECKPOINT 2 — left turn ========== */}
          <g>
            <line x1={sx - 40} y1={(r2 + r3) / 2 - roadW - 5}
              x2={sx + 10} y2={(r2 + r3) / 2 - roadW - 5}
              stroke="#ff6b35" strokeWidth="3" opacity="0.7" filter="url(#glow)" />
            <line x1={sx - 40} y1={(r2 + r3) / 2 + roadW + 5}
              x2={sx + 10} y2={(r2 + r3) / 2 + roadW + 5}
              stroke="#ff6b35" strokeWidth="3" opacity="0.7" filter="url(#glow)" />
            <line x1={sx - 40} y1={(r2 + r3) / 2 - roadW - 5}
              x2={sx - 40} y2={(r2 + r3) / 2 + roadW + 5}
              stroke="#ff6b35" strokeWidth="2" opacity="0.5" />
            <line x1={sx + 10} y1={(r2 + r3) / 2 - roadW - 5}
              x2={sx + 10} y2={(r2 + r3) / 2 + roadW + 5}
              stroke="#ff6b35" strokeWidth="2" opacity="0.5" />
            <text x={sx - 15} y={(r2 + r3) / 2 - roadW - 14} textAnchor="middle"
              fill="#ff6b35" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700">
              ЧЕКПОИНТ 2
            </text>
          </g>

          {/* ========== FINISH ========== */}
          <g>
            <rect x={ex - 6} y={r3 - roadW} width="12" height={roadW * 2}
              fill="url(#checker)" opacity="0.8" />
            {/* Neon glow lines beside finish */}
            <line x1={ex - 12} y1={r3 - roadW} x2={ex - 12} y2={r3 + roadW}
              stroke="#ffd600" strokeWidth="2" opacity="0.5" filter="url(#glow)">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1={ex + 12} y1={r3 - roadW} x2={ex + 12} y2={r3 + roadW}
              stroke="#ffd600" strokeWidth="2" opacity="0.5" filter="url(#glow)">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
            </line>
            <text x={ex} y={r3 + roadW + 18} textAnchor="middle"
              fill="#ffd600" fontSize="11" fontFamily="Orbitron, sans-serif"
              fontWeight="900" letterSpacing="3" filter="url(#glow)">
              FINISH
            </text>
          </g>

          {/* ========== CARS (top-down view) ========== */}
          {sorted.map((crew, index) => {
            // Grid: 2 rows of cars across the road width, staggered behind start
            const row = index % 4;
            const col = Math.floor(index / 4);
            const x = sx - 28 - col * 42;
            const y = r1 - 30 + row * 22;

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
                {/* Hit area */}
                <rect x={x - 20} y={y - 14} width="40" height="28" fill="transparent" />

                <g transform={`translate(${x}, ${y}) scale(1.5)`}>
                  {/* Ground glow under car */}
                  <ellipse cx={0} cy={0} rx={14} ry={7}
                    fill={crew.color} opacity={isHovered ? 0.35 : 0.12} />

                  {/* === TOP-DOWN CAR === */}
                  <g filter={isHovered ? 'url(#glowStrong)' : undefined}>
                    {/* Body — rounded rectangle, pointing right */}
                    <rect x={-11} y={-5} width="22" height="10" rx="4" ry="3"
                      fill={crew.color} opacity="0.95" />

                    {/* Darker center cabin */}
                    <rect x={-4} y={-3.5} width="8" height="7" rx="2"
                      fill="#00000050" />

                    {/* Windshield (front) */}
                    <rect x={7} y={-3} width="3" height="6" rx="1"
                      fill="rgba(0,212,255,0.45)" />

                    {/* Rear window */}
                    <rect x={-10} y={-2.5} width="2" height="5" rx="0.8"
                      fill="rgba(255,255,255,0.15)" />
                  </g>

                  {/* Wheels — 4 small dark rects */}
                  <rect x={6} y={-7.5} width="4" height="3" rx="1" fill="#1a1a1a" stroke="#444" strokeWidth="0.3" />
                  <rect x={6} y={4.5} width="4" height="3" rx="1" fill="#1a1a1a" stroke="#444" strokeWidth="0.3" />
                  <rect x={-9} y={-7.5} width="4" height="3" rx="1" fill="#1a1a1a" stroke="#444" strokeWidth="0.3" />
                  <rect x={-9} y={4.5} width="4" height="3" rx="1" fill="#1a1a1a" stroke="#444" strokeWidth="0.3" />

                  {/* Headlights */}
                  <circle cx={11.5} cy={-2.5} r="1.2" fill="#fff" opacity="0.85" />
                  <circle cx={11.5} cy={2.5} r="1.2" fill="#fff" opacity="0.85" />

                  {/* Tail lights */}
                  <circle cx={-11.5} cy={-2.5} r="1" fill="#ff3366" opacity="0.9" />
                  <circle cx={-11.5} cy={2.5} r="1" fill="#ff3366" opacity="0.9" />

                  {/* Number on roof */}
                  <text x={0} y={2} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="6" fontFamily="Orbitron, sans-serif"
                    fontWeight="800">
                    {rank}
                  </text>
                </g>

                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect x={x - 55} y={y - 34} width="110" height="22" rx="6"
                      fill="#0d0d18" stroke={crew.color} strokeWidth="1" opacity="0.95" />
                    <text x={x} y={y - 19} textAnchor="middle" fill="#fff"
                      fontSize="9" fontFamily="Rajdhani, sans-serif" fontWeight="600">
                      {crew.teamName} · #{rank}
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
