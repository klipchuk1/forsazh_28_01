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

  // Z-path centerline
  const cr = 44;
  const zPath = (() => {
    let p = `M ${sx} ${r1} L ${ex} ${r1}`;
    p += ` Q ${ex + cr} ${(r1 + r2) / 2}, ${ex} ${r2}`;
    p += ` L ${sx} ${r2}`;
    p += ` Q ${sx - cr} ${(r2 + r3) / 2}, ${sx} ${r3}`;
    p += ` L ${ex} ${r3}`;
    return p;
  })();

  // Kerb positions for red-white stripes
  const kerbSegments = (rowY: number, count: number, side: 'top' | 'bottom') => {
    const step = (ex - sx) / count;
    const yOff = side === 'top' ? -roadW - 3 : roadW - 3;
    return Array.from({ length: count }, (_, i) => ({
      x: sx + i * step,
      y: rowY + yOff,
    }));
  };

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
            {/* Glow filters */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowCyan">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feFlood floodColor="#00d4ff" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="b" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowOrange">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feFlood floodColor="#ff6b35" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="b" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="carGlow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Asphalt texture */}
            <filter id="asphalt">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
              <feComponentTransfer in="gray" result="dark">
                <feFuncR type="linear" slope="0.06" intercept="0" />
                <feFuncG type="linear" slope="0.06" intercept="0" />
                <feFuncB type="linear" slope="0.08" intercept="0" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="dark" mode="overlay" />
            </filter>

            {/* Checker pattern for start/finish */}
            <pattern id="checker" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#e8e8e8" />
              <rect x="6" width="6" height="6" fill="#1a1a2e" />
              <rect y="6" width="6" height="6" fill="#1a1a2e" />
              <rect x="6" y="6" width="6" height="6" fill="#e8e8e8" />
            </pattern>

            {/* Red-white kerb pattern */}
            <pattern id="kerbH" width="16" height="6" patternUnits="userSpaceOnUse">
              <rect width="8" height="6" fill="#ff2233" />
              <rect x="8" width="8" height="6" fill="#ffffff" />
            </pattern>

            {/* Road gradient for depth */}
            <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="50%" stopColor="#141425" />
              <stop offset="100%" stopColor="#1a1a2e" />
            </linearGradient>
          </defs>

          {/* ========== BACKGROUND ========== */}
          <rect width={W} height={H} fill="#0a0a15" />

          {/* ========== ROAD SURFACE ========== */}
          {/* Main dark asphalt — with texture */}
          <path d={zPath} fill="none" stroke="#181830" strokeWidth={roadW * 2 + 8}
            strokeLinecap="round" strokeLinejoin="round" filter="url(#asphalt)" />
          <path d={zPath} fill="none" stroke="#15152a" strokeWidth={roadW * 2}
            strokeLinecap="round" strokeLinejoin="round" filter="url(#asphalt)" />

          {/* ========== KERB STRIPES (red-white) ========== */}
          {/* Row 1 — top & bottom kerbs */}
          {[r1, r2, r3].map((rowY, ri) => {
            const kerbCount = Math.floor((ex - sx) / 16);
            return ['top', 'bottom'].map((side) => {
              const segs = kerbSegments(rowY, kerbCount, side as 'top' | 'bottom');
              return segs.map((seg, si) => (
                <rect key={`kerb-${ri}-${side}-${si}`}
                  x={seg.x} y={seg.y}
                  width="8" height="6" rx="1"
                  fill={si % 2 === 0 ? '#dd2244' : '#e8e8e8'}
                  opacity="0.55"
                />
              ));
            });
          })}

          {/* ========== NEON EDGE LINES ========== */}
          {/* Outer edge — cyan neon */}
          <path d={zPath} fill="none" stroke="#00d4ff" strokeWidth={roadW * 2 + 6}
            strokeLinecap="round" strokeLinejoin="round" opacity="0" />
          <path d={zPath} fill="none" stroke="#00d4ff" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            opacity="0.8" filter="url(#glowCyan)"
            strokeDashoffset="0"
            style={{ transform: `translateY(${-roadW}px)` }} />

          {/* Since SVG path offset is complex, use two parallel visible lines */}
          {/* Top edge of each row */}
          <line x1={sx} y1={r1 - roadW} x2={ex} y2={r1 - roadW}
            stroke="#00d4ff" strokeWidth="2.5" opacity="0.85" filter="url(#glowCyan)" />
          <line x1={sx} y1={r1 + roadW} x2={ex} y2={r1 + roadW}
            stroke="#ff6b35" strokeWidth="2.5" opacity="0.7" filter="url(#glowOrange)" />

          <line x1={sx} y1={r2 - roadW} x2={ex} y2={r2 - roadW}
            stroke="#00d4ff" strokeWidth="2.5" opacity="0.85" filter="url(#glowCyan)" />
          <line x1={sx} y1={r2 + roadW} x2={ex} y2={r2 + roadW}
            stroke="#ff6b35" strokeWidth="2.5" opacity="0.7" filter="url(#glowOrange)" />

          <line x1={sx} y1={r3 - roadW} x2={ex} y2={r3 - roadW}
            stroke="#00d4ff" strokeWidth="2.5" opacity="0.85" filter="url(#glowCyan)" />
          <line x1={sx} y1={r3 + roadW} x2={ex} y2={r3 + roadW}
            stroke="#ff6b35" strokeWidth="2.5" opacity="0.7" filter="url(#glowOrange)" />

          {/* Turn connections — neon arcs on turns */}
          {/* Right turn (r1 -> r2) */}
          <path d={`M ${ex} ${r1 + roadW} Q ${ex + cr + roadW} ${(r1 + r2) / 2}, ${ex} ${r2 - roadW}`}
            fill="none" stroke="#ff6b35" strokeWidth="2.5" opacity="0.7" filter="url(#glowOrange)" />
          <path d={`M ${ex} ${r1 - roadW} Q ${ex + cr - roadW} ${(r1 + r2) / 2}, ${ex} ${r2 + roadW}`}
            fill="none" stroke="#00d4ff" strokeWidth="2.5" opacity="0.85" filter="url(#glowCyan)" />

          {/* Left turn (r2 -> r3) */}
          <path d={`M ${sx} ${r2 + roadW} Q ${sx - cr - roadW} ${(r2 + r3) / 2}, ${sx} ${r3 - roadW}`}
            fill="none" stroke="#ff6b35" strokeWidth="2.5" opacity="0.7" filter="url(#glowOrange)" />
          <path d={`M ${sx} ${r2 - roadW} Q ${sx - cr + roadW} ${(r2 + r3) / 2}, ${sx} ${r3 + roadW}`}
            fill="none" stroke="#00d4ff" strokeWidth="2.5" opacity="0.85" filter="url(#glowCyan)" />

          {/* ========== CENTER DASHED LINE ========== */}
          <path d={zPath} fill="none" stroke="#ffffff" strokeWidth="2"
            strokeDasharray="18,24" opacity="0.35" />

          {/* ========== TIRE BARRIERS on outer curves ========== */}
          {/* Right turn outer tires */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = -Math.PI / 2 + (Math.PI * i) / 7;
            const tireR = roadW + cr + 18;
            const cx = ex + Math.cos(angle) * tireR;
            const cy = (r1 + r2) / 2 + Math.sin(angle) * tireR * 0.55;
            return (
              <circle key={`tire-r-${i}`} cx={cx} cy={cy} r="6"
                fill="#222" stroke="#444" strokeWidth="1.5" opacity="0.7" />
            );
          })}
          {/* Left turn outer tires */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = Math.PI / 2 + (Math.PI * i) / 7;
            const tireR = roadW + cr + 18;
            const cx = sx + Math.cos(angle) * tireR;
            const cy = (r2 + r3) / 2 + Math.sin(angle) * tireR * 0.55;
            return (
              <circle key={`tire-l-${i}`} cx={cx} cy={cy} r="6"
                fill="#222" stroke="#444" strokeWidth="1.5" opacity="0.7" />
            );
          })}

          {/* ========== LABELS ========== */}
          <text x={sx + (ex - sx) / 2} y={r1 - roadW - 18} textAnchor="middle"
            fill="#a855f7" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9" filter="url(#glow)">
            ЭТАП 1 — МАРТ
          </text>
          <text x={sx + (ex - sx) / 2} y={r2 - roadW - 18} textAnchor="middle"
            fill="#ff6b35" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9" filter="url(#glow)">
            ЭТАП 2 — АПРЕЛЬ
          </text>
          <text x={sx + (ex - sx) / 2} y={r3 - roadW - 18} textAnchor="middle"
            fill="#ffd600" fontSize="14" fontFamily="Orbitron, sans-serif"
            fontWeight="700" letterSpacing="2" opacity="0.9" filter="url(#glow)">
            ЭТАП 3 — МАЙ
          </text>

          {/* ========== START LINE ========== */}
          <g>
            {/* Checkered band */}
            <rect x={sx - 8} y={r1 - roadW} width="16" height={roadW * 2}
              fill="url(#checker)" opacity="0.9" />
            {/* Neon cyan glow line over start */}
            <line x1={sx} y1={r1 - roadW - 2} x2={sx} y2={r1 + roadW + 2}
              stroke="#00d4ff" strokeWidth="3" opacity="0.9" filter="url(#glowCyan)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </line>
            <text x={sx} y={r1 - roadW - 28} textAnchor="middle"
              fill="#00ff88" fontSize="12" fontFamily="Orbitron, sans-serif"
              fontWeight="800" letterSpacing="3" filter="url(#glow)">
              START
            </text>
          </g>

          {/* ========== CHECKPOINT 1 — right turn ========== */}
          <g>
            {/* Gate frame */}
            <line x1={ex + 6} y1={(r1 + r2) / 2 - roadW - 8}
              x2={ex + 6} y2={(r1 + r2) / 2 + roadW + 8}
              stroke="#a855f7" strokeWidth="3" opacity="0.8" filter="url(#glow)" />
            <line x1={ex + 12} y1={(r1 + r2) / 2 - roadW - 8}
              x2={ex + 12} y2={(r1 + r2) / 2 + roadW + 8}
              stroke="#a855f7" strokeWidth="1.5" opacity="0.5" />
            {/* Top/bottom bars */}
            <line x1={ex + 4} y1={(r1 + r2) / 2 - roadW - 8}
              x2={ex + 14} y2={(r1 + r2) / 2 - roadW - 8}
              stroke="#a855f7" strokeWidth="2" opacity="0.7" />
            <line x1={ex + 4} y1={(r1 + r2) / 2 + roadW + 8}
              x2={ex + 14} y2={(r1 + r2) / 2 + roadW + 8}
              stroke="#a855f7" strokeWidth="2" opacity="0.7" />
            {/* Pulsing glow */}
            <line x1={ex + 6} y1={(r1 + r2) / 2 - roadW}
              x2={ex + 6} y2={(r1 + r2) / 2 + roadW}
              stroke="#a855f7" strokeWidth="6" opacity="0.15" filter="url(#glow)">
              <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
            </line>
            <text x={ex + 30} y={(r1 + r2) / 2} textAnchor="middle"
              fill="#a855f7" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700"
              writingMode="tb" letterSpacing="2" opacity="0.8">
              CP1
            </text>
          </g>

          {/* ========== CHECKPOINT 2 — left turn ========== */}
          <g>
            <line x1={sx - 6} y1={(r2 + r3) / 2 - roadW - 8}
              x2={sx - 6} y2={(r2 + r3) / 2 + roadW + 8}
              stroke="#ff6b35" strokeWidth="3" opacity="0.8" filter="url(#glow)" />
            <line x1={sx - 12} y1={(r2 + r3) / 2 - roadW - 8}
              x2={sx - 12} y2={(r2 + r3) / 2 + roadW + 8}
              stroke="#ff6b35" strokeWidth="1.5" opacity="0.5" />
            <line x1={sx - 14} y1={(r2 + r3) / 2 - roadW - 8}
              x2={sx - 4} y2={(r2 + r3) / 2 - roadW - 8}
              stroke="#ff6b35" strokeWidth="2" opacity="0.7" />
            <line x1={sx - 14} y1={(r2 + r3) / 2 + roadW + 8}
              x2={sx - 4} y2={(r2 + r3) / 2 + roadW + 8}
              stroke="#ff6b35" strokeWidth="2" opacity="0.7" />
            <line x1={sx - 6} y1={(r2 + r3) / 2 - roadW}
              x2={sx - 6} y2={(r2 + r3) / 2 + roadW}
              stroke="#ff6b35" strokeWidth="6" opacity="0.15" filter="url(#glow)">
              <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
            </line>
            <text x={sx - 30} y={(r2 + r3) / 2} textAnchor="middle"
              fill="#ff6b35" fontSize="10" fontFamily="Orbitron, sans-serif" fontWeight="700"
              writingMode="tb" letterSpacing="2" opacity="0.8">
              CP2
            </text>
          </g>

          {/* ========== FINISH LINE ========== */}
          <g>
            <rect x={ex - 8} y={r3 - roadW} width="16" height={roadW * 2}
              fill="url(#checker)" opacity="0.9" />
            {/* Neon glow lines */}
            <line x1={ex - 14} y1={r3 - roadW} x2={ex - 14} y2={r3 + roadW}
              stroke="#ffd600" strokeWidth="3" opacity="0.8" filter="url(#glow)">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1={ex + 14} y1={r3 - roadW} x2={ex + 14} y2={r3 + roadW}
              stroke="#ffd600" strokeWidth="3" opacity="0.8" filter="url(#glow)">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
            </line>
            <text x={ex} y={r3 + roadW + 22} textAnchor="middle"
              fill="#ffd600" fontSize="13" fontFamily="Orbitron, sans-serif"
              fontWeight="900" letterSpacing="4" filter="url(#glow)">
              FINISH
            </text>
          </g>

          {/* ========== CARS (top-down racing view) ========== */}
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
                {/* Hit area */}
                <rect x={x - 24} y={y - 18} width="48" height="36" fill="transparent" />

                <g transform={`translate(${x}, ${y}) scale(1.6)`}>
                  {/* Ground neon glow (like underglow lighting) */}
                  <ellipse cx={0} cy={0} rx={16} ry={8}
                    fill={crew.color} opacity={isHovered ? 0.5 : 0.2} filter="url(#carGlow)" />

                  {/* Light trail behind car */}
                  <rect x={-22} y={-1.5} width="10" height="3" rx="1.5"
                    fill={crew.color} opacity="0.25" filter="url(#glow)" />

                  {/* === CAR BODY (top-down, pointing right) === */}
                  <g filter={isHovered ? 'url(#glowStrong)' : undefined}>
                    {/* Main body shape */}
                    <rect x={-12} y={-5.5} width="24" height="11" rx="5" ry="3.5"
                      fill={crew.color} opacity="0.95" />

                    {/* Body highlight / reflection */}
                    <rect x={-8} y={-4.5} width="16" height="3" rx="1.5"
                      fill="#ffffff" opacity="0.15" />

                    {/* Cabin / windshield area */}
                    <rect x={-3} y={-4} width="10" height="8" rx="2.5"
                      fill="#00000055" />

                    {/* Windshield glass (front) */}
                    <rect x={5} y={-3.2} width="3.5" height="6.4" rx="1.2"
                      fill="rgba(0,200,255,0.5)" />

                    {/* Rear window */}
                    <rect x={-6} y={-2.8} width="2.5" height="5.6" rx="0.8"
                      fill="rgba(180,220,255,0.2)" />

                    {/* Side mirrors */}
                    <rect x={2} y={-7} width="2" height="1.5" rx="0.5"
                      fill={crew.color} opacity="0.8" />
                    <rect x={2} y={5.5} width="2" height="1.5" rx="0.5"
                      fill={crew.color} opacity="0.8" />
                  </g>

                  {/* Wheels with rim detail */}
                  <g>
                    {/* Front right */}
                    <rect x={7} y={-8} width="4.5" height="3" rx="1" fill="#111" stroke="#555" strokeWidth="0.4" />
                    <line x1={8.5} y1={-7.5} x2={10} y2={-7.5} stroke="#666" strokeWidth="0.3" />
                    {/* Front left */}
                    <rect x={7} y={5} width="4.5" height="3" rx="1" fill="#111" stroke="#555" strokeWidth="0.4" />
                    <line x1={8.5} y1={5.5} x2={10} y2={5.5} stroke="#666" strokeWidth="0.3" />
                    {/* Rear right */}
                    <rect x={-10} y={-8} width="4.5" height="3" rx="1" fill="#111" stroke="#555" strokeWidth="0.4" />
                    <line x1={-9} y1={-7.5} x2={-7} y2={-7.5} stroke="#666" strokeWidth="0.3" />
                    {/* Rear left */}
                    <rect x={-10} y={5} width="4.5" height="3" rx="1" fill="#111" stroke="#555" strokeWidth="0.4" />
                    <line x1={-9} y1={5.5} x2={-7} y2={5.5} stroke="#666" strokeWidth="0.3" />
                  </g>

                  {/* Headlights — bright white with glow */}
                  <circle cx={12.5} cy={-3} r="1.3" fill="#fff" opacity="0.95" />
                  <circle cx={12.5} cy={3} r="1.3" fill="#fff" opacity="0.95" />
                  {/* Headlight beams */}
                  <rect x={13} y={-4} width="5" height="2" rx="1"
                    fill="#ffffff" opacity="0.08" />
                  <rect x={13} y={2} width="5" height="2" rx="1"
                    fill="#ffffff" opacity="0.08" />

                  {/* Tail lights — red glow */}
                  <circle cx={-12.5} cy={-3} r="1.1" fill="#ff2244" opacity="0.95" />
                  <circle cx={-12.5} cy={3} r="1.1" fill="#ff2244" opacity="0.95" />
                  {/* Brake glow */}
                  <circle cx={-12.5} cy={-3} r="2.5" fill="#ff2244" opacity="0.15" />
                  <circle cx={-12.5} cy={3} r="2.5" fill="#ff2244" opacity="0.15" />

                  {/* Number on roof */}
                  <text x={1} y={2} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="5.5" fontFamily="Orbitron, sans-serif"
                    fontWeight="800" style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                    {rank}
                  </text>
                </g>

                {/* Hover tooltip */}
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
