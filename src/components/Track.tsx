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
  const H = 620;
  const sx = 150;
  const ex = W - 110;
  const r1 = 130;
  const r2 = 320;
  const r3 = 510;
  const roadW = 72;

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
      gsap.to(el, {
        opacity: 0.88, duration: 1.2 + Math.random() * 0.6,
        repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.8 + i * 0.05,
      });
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
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Asphalt noise texture */}
            <filter id="asphalt">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
              <feComponentTransfer in="gray" result="dark">
                <feFuncA type="linear" slope="0.08" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="dark" mode="overlay" />
            </filter>

            {/* Checkered pattern */}
            <pattern id="checker" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#e0e0e0" />
              <rect x="6" width="6" height="6" fill="#1a1a2e" />
              <rect y="6" width="6" height="6" fill="#1a1a2e" />
              <rect x="6" y="6" width="6" height="6" fill="#e0e0e0" />
            </pattern>
          </defs>

          {/* ===== BACKGROUND ===== */}
          <rect width={W} height={H} fill="#0a0a14" />

          {/* ===== ROAD LAYERS (bottom to top) ===== */}
          {/* Layer 1: Red-white kerb stripes (widest) */}
          <path d={zPath} fill="none" stroke="#cc2244" strokeWidth={roadW * 2 + 14}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="12,12" opacity="0.6" />
          <path d={zPath} fill="none" stroke="#e8e8e8" strokeWidth={roadW * 2 + 14}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="12,12" strokeDashoffset="12" opacity="0.5" />

          {/* Layer 2: Neon cyan edge glow */}
          <path d={zPath} fill="none" stroke="#00d4ff" strokeWidth={roadW * 2 + 6}
            strokeLinecap="round" strokeLinejoin="round"
            opacity="0.5" filter="url(#neonGlow)" />

          {/* Layer 3: Orange inner glow */}
          <path d={zPath} fill="none" stroke="#ff6b20" strokeWidth={roadW * 2 + 4}
            strokeLinecap="round" strokeLinejoin="round"
            opacity="0.2" />

          {/* Layer 4: Dark asphalt surface (covers center) */}
          <path d={zPath} fill="none" stroke="#1a1a2e" strokeWidth={roadW * 2}
            strokeLinecap="round" strokeLinejoin="round" filter="url(#asphalt)" />

          {/* Layer 5: Subtle road surface gradient (darker center) */}
          <path d={zPath} fill="none" stroke="#13132288" strokeWidth={roadW * 1.4}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* ===== ROAD MARKINGS ===== */}
          {/* Center dashed white line */}
          <path d={zPath} fill="none" stroke="#ffffff" strokeWidth="2"
            strokeDasharray="20,28" opacity="0.4" />

          {/* Second lane markers (offset from center) */}
          <path d={zPath} fill="none" stroke="#ffffff" strokeWidth="1"
            strokeDasharray="12,20" opacity="0.15"
            transform="translate(0, -24)" />
          <path d={zPath} fill="none" stroke="#ffffff" strokeWidth="1"
            strokeDasharray="12,20" opacity="0.15"
            transform="translate(0, 24)" />

          {/* ===== TIRE BARRIERS on curves ===== */}
          {/* Right turn */}
          {Array.from({ length: 10 }, (_, i) => {
            const angle = -Math.PI / 2 + (Math.PI * i) / 9;
            const tireR = roadW + cr + 14;
            const cx = ex + Math.cos(angle) * tireR;
            const cy = (r1 + r2) / 2 + Math.sin(angle) * tireR * 0.6;
            return (
              <g key={`tire-r-${i}`}>
                <circle cx={cx} cy={cy} r="7" fill="#1a1a1a" stroke="#333" strokeWidth="2" />
                <circle cx={cx} cy={cy} r="3" fill="#111" stroke="#2a2a2a" strokeWidth="0.5" />
              </g>
            );
          })}
          {/* Left turn */}
          {Array.from({ length: 10 }, (_, i) => {
            const angle = Math.PI / 2 + (Math.PI * i) / 9;
            const tireR = roadW + cr + 14;
            const cx = sx + Math.cos(angle) * tireR;
            const cy = (r2 + r3) / 2 + Math.sin(angle) * tireR * 0.6;
            return (
              <g key={`tire-l-${i}`}>
                <circle cx={cx} cy={cy} r="7" fill="#1a1a1a" stroke="#333" strokeWidth="2" />
                <circle cx={cx} cy={cy} r="3" fill="#111" stroke="#2a2a2a" strokeWidth="0.5" />
              </g>
            );
          })}

          {/* ===== NEON ACCENT LIGHTS along track edges ===== */}
          {/* Small glowing dots/lights along straight sections */}
          {[r1, r2, r3].map((rowY, ri) =>
            Array.from({ length: 18 }, (_, i) => {
              const xPos = sx + ((ex - sx) * (i + 0.5)) / 18;
              return (
                <g key={`light-${ri}-${i}`}>
                  {/* Top edge light */}
                  <circle cx={xPos} cy={rowY - roadW - 2} r="2"
                    fill={i % 3 === 0 ? '#00d4ff' : '#ff6b20'}
                    opacity="0.7" filter="url(#glow)">
                    <animate attributeName="opacity"
                      values={`0.3;0.8;0.3`}
                      dur={`${1.5 + (i % 4) * 0.3}s`}
                      repeatCount="indefinite" />
                  </circle>
                  {/* Bottom edge light */}
                  <circle cx={xPos} cy={rowY + roadW + 2} r="2"
                    fill={i % 3 === 0 ? '#ff6b20' : '#00d4ff'}
                    opacity="0.7" filter="url(#glow)">
                    <animate attributeName="opacity"
                      values={`0.3;0.8;0.3`}
                      dur={`${1.8 + (i % 3) * 0.4}s`}
                      repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })
          )}

          {/* ===== LABELS ===== */}
          <text x={sx + (ex - sx) / 2} y={r1 - roadW - 22} textAnchor="middle"
            fill="#a855f7" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9">
            ЭТАП 1 — МАРТ
          </text>
          <text x={sx + (ex - sx) / 2} y={r2 - roadW - 22} textAnchor="middle"
            fill="#ff6b35" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9">
            ЭТАП 2 — АПРЕЛЬ
          </text>
          <text x={sx + (ex - sx) / 2} y={r3 - roadW - 22} textAnchor="middle"
            fill="#ffd600" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9">
            ЭТАП 3 — МАЙ
          </text>

          {/* ===== START LINE ===== */}
          <g>
            <rect x={sx - 8} y={r1 - roadW} width="16" height={roadW * 2}
              fill="url(#checker)" opacity="0.9" />
            {/* Cyan neon glow line */}
            <line x1={sx} y1={r1 - roadW - 4} x2={sx} y2={r1 + roadW + 4}
              stroke="#00d4ff" strokeWidth="3" opacity="0.9" filter="url(#neonGlow)">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </line>
            <text x={sx} y={r1 - roadW - 30} textAnchor="middle"
              fill="#00ff88" fontSize="12" fontFamily="Orbitron, sans-serif"
              fontWeight="800" letterSpacing="3" filter="url(#glow)">
              START
            </text>
          </g>

          {/* ===== FINISH LINE ===== */}
          <g>
            <rect x={ex - 8} y={r3 - roadW} width="16" height={roadW * 2}
              fill="url(#checker)" opacity="0.9" />
            <line x1={ex} y1={r3 - roadW - 4} x2={ex} y2={r3 + roadW + 4}
              stroke="#ffd600" strokeWidth="3" opacity="0.9" filter="url(#neonGlow)">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
            </line>
            <text x={ex} y={r3 + roadW + 24} textAnchor="middle"
              fill="#ffd600" fontSize="13" fontFamily="Orbitron, sans-serif"
              fontWeight="900" letterSpacing="4" filter="url(#glow)">
              FINISH
            </text>
          </g>

          {/* ===== CARS ===== */}
          {sorted.map((crew, index) => {
            const row = index % 4;
            const col = Math.floor(index / 4);
            const x = sx - 30 - col * 48;
            const y = r1 - 32 + row * 24;
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

                <g transform={`translate(${x}, ${y}) scale(1.6)`}>
                  {/* Underglow */}
                  <ellipse cx={0} cy={0} rx={16} ry={8}
                    fill={crew.color} opacity={isHovered ? 0.45 : 0.18} filter="url(#glow)" />

                  {/* Exhaust trail */}
                  <ellipse cx={-18} cy={0} rx={5} ry={2}
                    fill={crew.color} opacity="0.15" filter="url(#glow)" />

                  <g filter={isHovered ? 'url(#glowStrong)' : undefined}>
                    {/* Car body */}
                    <rect x={-12} y={-5.5} width="24" height="11" rx="5" ry="3.5"
                      fill={crew.color} opacity="0.95" />
                    {/* Highlight streak */}
                    <rect x={-8} y={-4.5} width="16" height="2.5" rx="1.2"
                      fill="#ffffff" opacity="0.18" />
                    {/* Cabin */}
                    <rect x={-3} y={-4} width="10" height="8" rx="2.5"
                      fill="#00000060" />
                    {/* Front windshield */}
                    <rect x={5} y={-3.2} width="3.5" height="6.4" rx="1.2"
                      fill="rgba(0,200,255,0.45)" />
                    {/* Rear window */}
                    <rect x={-6} y={-2.8} width="2.5" height="5.6" rx="0.8"
                      fill="rgba(180,220,255,0.18)" />
                    {/* Side mirrors */}
                    <rect x={2} y={-7} width="2" height="1.5" rx="0.5"
                      fill={crew.color} opacity="0.8" />
                    <rect x={2} y={5.5} width="2" height="1.5" rx="0.5"
                      fill={crew.color} opacity="0.8" />
                  </g>

                  {/* Wheels */}
                  <rect x={7} y={-8} width="4.5" height="3" rx="1" fill="#111" stroke="#444" strokeWidth="0.4" />
                  <rect x={7} y={5} width="4.5" height="3" rx="1" fill="#111" stroke="#444" strokeWidth="0.4" />
                  <rect x={-10} y={-8} width="4.5" height="3" rx="1" fill="#111" stroke="#444" strokeWidth="0.4" />
                  <rect x={-10} y={5} width="4.5" height="3" rx="1" fill="#111" stroke="#444" strokeWidth="0.4" />

                  {/* Headlights */}
                  <circle cx={12.5} cy={-3} r="1.3" fill="#fff" opacity="0.95" />
                  <circle cx={12.5} cy={3} r="1.3" fill="#fff" opacity="0.95" />

                  {/* Tail lights */}
                  <circle cx={-12.5} cy={-3} r="1.1" fill="#ff2244" opacity="0.9" />
                  <circle cx={-12.5} cy={3} r="1.1" fill="#ff2244" opacity="0.9" />
                  <circle cx={-12.5} cy={-3} r="2.5" fill="#ff2244" opacity="0.12" />
                  <circle cx={-12.5} cy={3} r="2.5" fill="#ff2244" opacity="0.12" />

                  {/* Number */}
                  <text x={1} y={2} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="5.5" fontFamily="Orbitron, sans-serif"
                    fontWeight="800">
                    {rank}
                  </text>
                </g>

                {isHovered && (
                  <g>
                    <rect x={x - 60} y={y - 38} width="120" height="24" rx="6"
                      fill="#0a0a18" stroke={crew.color} strokeWidth="1.5" opacity="0.95" />
                    <text x={x} y={y - 22} textAnchor="middle" fill="#fff"
                      fontSize="9.5" fontFamily="Rajdhani, sans-serif" fontWeight="600">
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
