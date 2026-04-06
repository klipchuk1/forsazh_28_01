import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import type { Crew } from '../data/types';

interface TrackProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

function getTrackPosition(crew: Crew): number {
  if (!crew.finishTarget || crew.finishTarget <= 0) return 0;
  const pos = crew.totalScore / crew.finishTarget;
  return Number.isFinite(pos) ? Math.min(pos, 1.0) : 0;
}

export default function Track({ crews, onCrewClick }: TrackProps) {
  const [hoveredCrew, setHoveredCrew] = useState<number | null>(null);
  const [pathReady, setPathReady] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  // Hide scroll hint after user scrolls
  useEffect(() => {
    const wrapper = scrollWrapperRef.current;
    if (!wrapper || !isMobile) return;
    const handleScroll = () => {
      if (wrapper.scrollLeft > 20) setShowScrollHint(false);
    };
    wrapper.addEventListener('scroll', handleScroll, { passive: true });
    return () => wrapper.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

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
  const pathRef = useRef<SVGPathElement>(null);
  const animatedRef = useRef(false);

  // Signal when path element is mounted so we can compute positions
  useEffect(() => {
    if (pathRef.current) {
      setPathReady(true);
    }
  }, []);

  const getPointOnPath = useCallback((t: number): { x: number; y: number; angle: number } => {
    const path = pathRef.current;
    if (!path) return { x: sx, y: r1, angle: 0 };
    const totalLen = path.getTotalLength();
    const len = Math.max(0, Math.min(t, 1)) * totalLen;
    const pt = path.getPointAtLength(len);
    // Sample a tiny bit ahead to determine tangent direction
    const ahead = path.getPointAtLength(Math.min(len + 2, totalLen));
    const dx = ahead.x - pt.x;
    const dy = ahead.y - pt.y;
    // atan2 gives angle in radians; convert to degrees
    // Car sprites face right by default (0°), so angle=0 means moving right
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { x: pt.x, y: pt.y, angle };
  }, [pathReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (animatedRef.current || !pathReady) return;
    animatedRef.current = true;
    carsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el,
        { opacity: 0, scale: 0, transformOrigin: 'center center' },
        { opacity: 1, scale: 1, duration: 0.5, delay: 0.3 + i * 0.05, ease: 'back.out(1.4)' }
      );
    });
  }, [sorted.length, pathReady]);

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

      <div className="track-svg-wrapper" ref={scrollWrapperRef} style={{ position: 'relative' }}>
        {isMobile && showScrollHint && <div className="track-scroll-hint" />}
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
            <filter id="carShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.7" />
            </filter>
            <filter id="edgeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#ddd" />
              <rect x="5" width="5" height="5" fill="#222" />
              <rect y="5" width="5" height="5" fill="#222" />
              <rect x="5" y="5" width="5" height="5" fill="#ddd" />
            </pattern>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0f0f22" />
              <stop offset="100%" stopColor="#07070f" />
            </radialGradient>
          </defs>

          <rect width={W} height={H} fill="url(#bgGrad)" />

          {/* Hidden path for getPointAtLength calculations */}
          <path ref={pathRef} d={zPath} fill="none" stroke="none" />

          {/* === ROAD === */}

          {/* Outer edge glow */}
          <path d={zPath} fill="none" stroke="#00d4ff" strokeWidth={roadW * 2 + 10}
            strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />

          {/* Road base */}
          <path d={zPath} fill="none" stroke="#0a0a18" strokeWidth={roadW * 2 + 6}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Asphalt */}
          <path d={zPath} fill="none" stroke="#1c1c30" strokeWidth={roadW * 2}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Asphalt surface */}
          <path d={zPath} fill="none" stroke="#222238" strokeWidth={roadW * 2 - 8}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Centre lane divider */}
          <path d={zPath} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2"
            strokeDasharray="24,20" strokeLinecap="butt" />

          {/* Stage labels */}
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

          {/* Start */}
          <rect x={sx - 6} y={r1 - roadW} width="12" height={roadW * 2}
            fill="url(#checker)" opacity="0.85" />
          <text x={sx} y={r1 - roadW - 18} textAnchor="middle"
            fill="#00ff88" fontSize="11" fontFamily="Orbitron, sans-serif"
            fontWeight="800" letterSpacing="2">
            START
          </text>

          {/* Finish */}
          <rect x={ex - 6} y={r3 - roadW} width="12" height={roadW * 2}
            fill="url(#checker)" opacity="0.85" />
          <text x={ex} y={r3 + roadW + 20} textAnchor="middle"
            fill="#ffd600" fontSize="11" fontFamily="Orbitron, sans-serif"
            fontWeight="900" letterSpacing="3">
            FINISH
          </text>

          {/* Cars positioned along the track path */}
          {sorted.map((crew, index) => {
            const t = getTrackPosition(crew);
            const pt = getPointOnPath(t);

            // Offset perpendicular to the path so cars spread across lane width
            const angleRad = pt.angle * (Math.PI / 180);
            const laneOffset = ((crew.id % 5) - 2) * 16;
            // Perpendicular direction: rotate tangent 90°
            const x = pt.x + laneOffset * Math.sin(angleRad) * -1;
            const y = pt.y + laneOffset * Math.cos(angleRad);

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
                <rect x={x - 28} y={y - 28} width="56" height="56" fill="transparent" />
                <g transform={`translate(${x}, ${y}) rotate(${pt.angle})`}>
                  {/* Ground shadow */}
                  <ellipse cx={2} cy={6} rx={20} ry={7}
                    fill="#000" opacity="0.5" />
                  {/* Color glow under car */}
                  <ellipse cx={0} cy={2} rx={18} ry={8}
                    fill={crew.color} opacity={isHovered ? 0.45 : 0.22} />
                  <image
                    href={`/cars/car-${((crew.id - 1) % 12) + 1}.png`}
                    x={-26} y={-16}
                    width="52" height="32"
                    preserveAspectRatio="xMidYMid meet"
                    filter={isHovered ? `url(#glowStrong)` : `url(#carShadow)`}
                    style={{ filter: isHovered ? 'brightness(1.3) drop-shadow(0 0 8px ' + crew.color + ')' : 'drop-shadow(0 3px 4px rgba(0,0,0,0.8))' }}
                  />
                </g>
                {/* Rank badge — counter-rotated so it stays upright */}
                <g transform={`translate(${x}, ${y})`}>
                  <circle cx={0} cy={-16} r="10.5" fill={crew.color} stroke="#fff" strokeWidth="0.8" />
                  <text x={0} y={-15.5} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="9.75" fontFamily="Orbitron, sans-serif"
                    fontWeight="800">
                    {rank}
                  </text>
                </g>

              </g>
            );
          })}

          {/* Tooltip layer — rendered last so it's always on top */}
          {(() => {
            const crew = sorted.find(c => c.id === hoveredCrew);
            if (!crew) return null;
            const t = getTrackPosition(crew);
            const pt = getPointOnPath(t);
            const angleRad = pt.angle * (Math.PI / 180);
            const laneOffset = ((crew.id % 5) - 2) * 16;
            const x = pt.x + laneOffset * Math.sin(angleRad) * -1;
            const y = pt.y + laneOffset * Math.cos(angleRad);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={x - 170} y={y - 72} width="340" height="52" rx="5"
                  fill="#0c0c1a" stroke={crew.color} strokeWidth="1" opacity="0.95" />
                <text x={x} y={y - 48} textAnchor="middle" fill="#fff"
                  fontSize="18" fontFamily="Rajdhani, sans-serif" fontWeight="600">
                  {crew.teamName} · {crew.totalScore}pts
                </text>
                {crew.branch && (
                  <text x={x} y={y - 28} textAnchor="middle" fill={crew.color}
                    fontSize="16" fontFamily="Rajdhani, sans-serif" fontWeight="500">
                    {crew.branch}
                  </text>
                )}
              </g>
            );
          })()}
        </svg>
        {isMobile && showScrollHint && (
          <div className="track-scroll-label">
            <span>&#8592; листай &#8594;</span>
          </div>
        )}
      </div>
    </div>
  );
}
