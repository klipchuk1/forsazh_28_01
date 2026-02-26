import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { Crew } from '../data/types';

interface TrackProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

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
  const sx = 150;
  const ex = W - 110;
  const r1 = 120;
  const r2 = 300;
  const r3 = 480;
  const roadW = 68;

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
    });
  }, [sorted.length]);

  const cr = 44;
  const zPath = (() => {
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
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#ddd" />
              <rect x="5" width="5" height="5" fill="#222" />
              <rect y="5" width="5" height="5" fill="#222" />
              <rect x="5" y="5" width="5" height="5" fill="#ddd" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width={W} height={H} fill="#0c0c1a" />

          {/* === ROAD === */}
          {/* Outer edge — thin white border */}
          <path d={zPath} fill="none" stroke="#ffffff12" strokeWidth={roadW * 2 + 4}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Asphalt surface */}
          <path d={zPath} fill="none" stroke="#1e1e32" strokeWidth={roadW * 2}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Thin neon edge lines — cyan outer, orange inner */}
          <path d={zPath} fill="none" stroke="#00d4ff" strokeWidth={roadW * 2 + 2}
            strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          <path d={zPath} fill="none" stroke="#1e1e32" strokeWidth={roadW * 2}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Road surface darker center lane */}
          <path d={zPath} fill="none" stroke="#16162a" strokeWidth={roadW * 1.2}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Lane dashes */}
          <path d={zPath} fill="none" stroke="#ffffff" strokeWidth="1.5"
            strokeDasharray="18,26" opacity="0.25" />

          {/* === LABELS === */}
          <text x={sx + (ex - sx) / 2} y={r1 - roadW - 14} textAnchor="middle"
            fill="#a855f7" fontSize="13" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.85">
            ЭТАП 1 — МАРТ
          </text>
          <text x={sx + (ex - sx) / 2} y={r2 - roadW - 14} textAnchor="middle"
            fill="#ff6b35" fontSize="13" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.85">
            ЭТАП 2 — АПРЕЛЬ
          </text>
          <text x={sx + (ex - sx) / 2} y={r3 - roadW - 14} textAnchor="middle"
            fill="#ffd600" fontSize="13" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.85">
            ЭТАП 3 — МАЙ
          </text>

          {/* === START === */}
          <rect x={sx - 6} y={r1 - roadW} width="12" height={roadW * 2}
            fill="url(#checker)" opacity="0.85" />
          <text x={sx} y={r1 - roadW - 18} textAnchor="middle"
            fill="#00ff88" fontSize="11" fontFamily="Orbitron, sans-serif"
            fontWeight="800" letterSpacing="2">
            START
          </text>

          {/* === FINISH === */}
          <rect x={ex - 6} y={r3 - roadW} width="12" height={roadW * 2}
            fill="url(#checker)" opacity="0.85" />
          <text x={ex} y={r3 + roadW + 20} textAnchor="middle"
            fill="#ffd600" fontSize="11" fontFamily="Orbitron, sans-serif"
            fontWeight="900" letterSpacing="3">
            FINISH
          </text>

          {/* === CARS === */}
          {sorted.map((crew, index) => {
            const row = index % 4;
            const col = Math.floor(index / 4);
            const x = sx - 28 - col * 46;
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
                <rect x={x - 22} y={y - 16} width="44" height="32" fill="transparent" />

                <g transform={`translate(${x}, ${y}) scale(1.8)`}>
                  {/* Underglow reflection */}
                  <ellipse cx={0} cy={0} rx={15} ry={8}
                    fill={crew.color} opacity={isHovered ? 0.4 : 0.1} />

                  {/* ===== RACING CAR — top-down, pointing right ===== */}

                  {/* Rear wing / spoiler */}
                  <rect x={-14} y={-7.5} width="1.5" height="15" rx="0.5"
                    fill="#222" stroke="#555" strokeWidth="0.3" />
                  <rect x={-15.5} y={-8.5} width="4" height="1.2" rx="0.4" fill="#333" />
                  <rect x={-15.5} y={7.3} width="4" height="1.2" rx="0.4" fill="#333" />

                  {/* Main body — aerodynamic shape (path) */}
                  <path d={`
                    M -12 -5.5
                    C -12 -6.5, -10 -7, -7 -7
                    L 2 -6
                    C 6 -5.5, 10 -4, 13 -2
                    C 14 -1, 14 1, 13 2
                    C 10 4, 6 5.5, 2 6
                    L -7 7
                    C -10 7, -12 6.5, -12 5.5
                    Z
                  `} fill={crew.color} />

                  {/* Body panel lines */}
                  <path d="M -7 -7 L -7 7" stroke="#00000030" strokeWidth="0.4" />
                  <path d="M 2 -6 L 2 6" stroke="#00000025" strokeWidth="0.3" />

                  {/* Top highlight / reflection streak */}
                  <path d={`
                    M -6 -5.5 L 8 -3.5 C 10 -3, 11 -2, 11 -1.5
                    L 8 -2 L -6 -4 Z
                  `} fill="#ffffff" opacity="0.18" />

                  {/* Cockpit / cabin glass */}
                  <path d={`
                    M 0 -4.5
                    C 3 -4, 6 -3, 8 -1.5
                    C 8.5 0, 8.5 0, 8 1.5
                    C 6 3, 3 4, 0 4.5
                    C -1 4.5, -2 4, -2 3
                    L -2 -3
                    C -2 -4, -1 -4.5, 0 -4.5 Z
                  `} fill="#0a1828" opacity="0.7" />

                  {/* Windshield glass — lighter */}
                  <path d={`
                    M 3 -3.5 C 5 -3, 7 -2, 8 -1
                    C 8.3 0, 8.3 0, 8 1
                    C 7 2, 5 3, 3 3.5
                    L 2 3 L 2 -3 Z
                  `} fill="#1a5a8a" opacity="0.5" />

                  {/* Side air intakes */}
                  <rect x={-5} y={-7.2} width="4" height="1" rx="0.5"
                    fill="#111" opacity="0.6" />
                  <rect x={-5} y={6.2} width="4" height="1" rx="0.5"
                    fill="#111" opacity="0.6" />

                  {/* Front wheels */}
                  <rect x={5} y={-8.5} width="5" height="2.8" rx="1"
                    fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="0.4" />
                  <rect x={5} y={5.7} width="5" height="2.8" rx="1"
                    fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="0.4" />
                  {/* Front wheel rims */}
                  <circle cx={7.5} cy={-7.1} r="0.6" fill="#666" />
                  <circle cx={7.5} cy={7.1} r="0.6" fill="#666" />

                  {/* Rear wheels (wider) */}
                  <rect x={-10} y={-9} width="5.5" height="3" rx="1"
                    fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="0.4" />
                  <rect x={-10} y={6} width="5.5" height="3" rx="1"
                    fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="0.4" />
                  {/* Rear wheel rims */}
                  <circle cx={-7.2} cy={-7.5} r="0.7" fill="#666" />
                  <circle cx={-7.2} cy={7.5} r="0.7" fill="#666" />

                  {/* Headlights */}
                  <ellipse cx={13.2} cy={-1.5} rx="0.8" ry="1.2" fill="#ffffcc" opacity="0.95" />
                  <ellipse cx={13.2} cy={1.5} rx="0.8" ry="1.2" fill="#ffffcc" opacity="0.95" />

                  {/* Tail lights */}
                  <rect x={-13} y={-5.5} width="1.5" height="2.5" rx="0.5"
                    fill="#ff2244" opacity="0.9" />
                  <rect x={-13} y={3} width="1.5" height="2.5" rx="0.5"
                    fill="#ff2244" opacity="0.9" />

                  {/* Exhaust pipes */}
                  <circle cx={-13.5} cy={-1.5} r="0.6" fill="#444" stroke="#222" strokeWidth="0.3" />
                  <circle cx={-13.5} cy={1.5} r="0.6" fill="#444" stroke="#222" strokeWidth="0.3" />

                  {/* Number on roof */}
                  <text x={0} y={0.5} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="5" fontFamily="Orbitron, sans-serif"
                    fontWeight="800" style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.8))' }}>
                    {rank}
                  </text>
                </g>

                {isHovered && (
                  <g>
                    <rect x={x - 55} y={y - 34} width="110" height="22" rx="5"
                      fill="#0c0c1a" stroke={crew.color} strokeWidth="1" opacity="0.95" />
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
