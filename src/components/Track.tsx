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
                {/* Hit area */}
                <rect x={x - 28} y={y - 18} width="56" height="36" fill="transparent" />

                {/* Car PNG sprite */}
                <g transform={`translate(${x}, ${y})`}>
                  {/* Underglow in crew color */}
                  <ellipse cx={0} cy={0} rx={22} ry={12}
                    fill={crew.color} opacity={isHovered ? 0.35 : 0.1} />

                  {/* Car image — 400x300 sprite scaled down, centered */}
                  <image
                    href={`/cars/car-${((crew.id - 1) % 12) + 1}.png`}
                    x={-26} y={-16}
                    width="52" height="32"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 6px ' + crew.color + ')' : undefined }}
                  />

                  {/* Number badge */}
                  <circle cx={-16} cy={-10} r="6" fill={crew.color} stroke="#fff" strokeWidth="0.8" />
                  <text x={-16} y={-9.5} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="6" fontFamily="Orbitron, sans-serif"
                    fontWeight="800">
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
