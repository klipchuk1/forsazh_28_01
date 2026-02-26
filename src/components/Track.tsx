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
                  {/* Underglow */}
                  <ellipse cx={0} cy={0} rx={14} ry={8}
                    fill={crew.color} opacity={isHovered ? 0.35 : 0.08} />

                  {/* ===== SPORTS CAR — top-down, pointing right ===== */}

                  {/* Shadow under car */}
                  <ellipse cx={0} cy={0.5} rx={13} ry={7}
                    fill="#000" opacity="0.2" />

                  {/* Rear wheels (wider, behind body) */}
                  <rect x={-9} y={-9.2} width="5" height="3.2" rx="1.2"
                    fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
                  <rect x={-9} y={6} width="5" height="3.2" rx="1.2"
                    fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />

                  {/* Front wheels */}
                  <rect x={6} y={-8.5} width="4.5" height="2.8" rx="1"
                    fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
                  <rect x={6} y={5.7} width="4.5" height="2.8" rx="1"
                    fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />

                  {/* Main body — rounded sports car */}
                  <path d={`
                    M -11 0
                    C -11 -5, -9 -7, -5 -7.5
                    L 4 -6.5
                    C 8 -5.5, 11 -4, 13 -1.5
                    C 13.5 0, 13.5 0, 13 1.5
                    C 11 4, 8 5.5, 4 6.5
                    L -5 7.5
                    C -9 7, -11 5, -11 0
                    Z
                  `} fill={crew.color} />

                  {/* Racing stripes (two parallel lines) */}
                  <path d={`M -10 -1.8 L 12 -1.8`}
                    stroke="#ffffff" strokeWidth="1.2" opacity="0.35" />
                  <path d={`M -10 1.8 L 12 1.8`}
                    stroke="#ffffff" strokeWidth="1.2" opacity="0.35" />

                  {/* Hood (front section) — slightly darker */}
                  <path d={`
                    M 4 -5.5 C 7 -4.5, 10 -3, 12 -1
                    C 12.5 0, 12.5 0, 12 1
                    C 10 3, 7 4.5, 4 5.5
                    L 4 -5.5 Z
                  `} fill="#00000015" />

                  {/* Hood scoop / air intake */}
                  <rect x={7} y={-1.5} width="3" height="3" rx="1"
                    fill="#00000030" />
                  <rect x={7.5} y={-0.8} width="2" height="1.6" rx="0.5"
                    fill="#00000020" />

                  {/* Windshield — large, tinted */}
                  <path d={`
                    M 1 -5 C 3 -4.5, 4 -4, 4 -3.5
                    L 4 3.5 C 4 4, 3 4.5, 1 5
                    C 0 5, -1 4.5, -1 3.5
                    L -1 -3.5
                    C -1 -4.5, 0 -5, 1 -5 Z
                  `} fill="#1a4a6a" opacity="0.65" />

                  {/* Windshield reflection */}
                  <path d={`
                    M 1 -4.5 C 2.5 -4, 3.5 -3.5, 3.5 -3
                    L 3.5 -1 L -0.5 -1 L -0.5 -3.5
                    C -0.5 -4, 0 -4.5, 1 -4.5 Z
                  `} fill="#fff" opacity="0.12" />

                  {/* Rear window */}
                  <path d={`
                    M -6 -4.5 C -5 -5, -4 -5, -3 -4.5
                    L -3 4.5 C -4 5, -5 5, -6 4.5
                    L -6 -4.5 Z
                  `} fill="#0a1828" opacity="0.5" />

                  {/* Body highlight — top shine */}
                  <path d={`
                    M -8 -6 C -4 -7, 2 -6.5, 8 -4.5
                    C 10 -3.5, 11 -2.5, 11 -2
                    L 8 -3 C 4 -5, -2 -5.5, -8 -4.5 Z
                  `} fill="#fff" opacity="0.15" />

                  {/* Side mirrors */}
                  <ellipse cx={3} cy={-7.8} rx="1.2" ry="0.8"
                    fill={crew.color} stroke="#00000030" strokeWidth="0.3" />
                  <ellipse cx={3} cy={7.8} rx="1.2" ry="0.8"
                    fill={crew.color} stroke="#00000030" strokeWidth="0.3" />

                  {/* Headlights */}
                  <path d={`M 12 -2.5 C 13 -2, 13 -1, 12.5 -0.5 L 11.5 -1 Z`}
                    fill="#ffffdd" opacity="0.9" />
                  <path d={`M 12 2.5 C 13 2, 13 1, 12.5 0.5 L 11.5 1 Z`}
                    fill="#ffffdd" opacity="0.9" />

                  {/* Tail lights */}
                  <path d={`M -10.5 -3 C -11 -2, -11 -1, -10.5 -0.5 L -9.5 -1 Z`}
                    fill="#ff2244" opacity="0.9" />
                  <path d={`M -10.5 3 C -11 2, -11 1, -10.5 0.5 L -9.5 1 Z`}
                    fill="#ff2244" opacity="0.9" />

                  {/* Wheel rim details */}
                  <circle cx={-6.5} cy={-7.6} r="0.8" fill="#555" />
                  <circle cx={-6.5} cy={7.6} r="0.8" fill="#555" />
                  <circle cx={8.2} cy={-7.1} r="0.7" fill="#555" />
                  <circle cx={8.2} cy={7.1} r="0.7" fill="#555" />

                  {/* Number on roof */}
                  <text x={-1} y={0.5} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="5" fontFamily="Orbitron, sans-serif"
                    fontWeight="800" style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))' }}>
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
