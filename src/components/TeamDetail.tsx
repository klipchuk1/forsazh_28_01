import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Crew } from '../data/types';
import VoteButton from './VoteButton';
import AwardBadge from './AwardBadge';

interface TeamDetailProps {
  crew: Crew;
  crews: Crew[];
  onClose: () => void;
}

export default function TeamDetail({ crew, crews, onClose }: TeamDetailProps) {
  const rank = [...crews]
    .sort((a, b) => b.totalScore - a.totalScore)
    .findIndex((c) => c.id === crew.id) + 1;

  const videoSrc = crew.videoUrl || '/crew-sample.mp4';

  const overallPct = crew.finishTarget > 0
    ? Math.round((crew.totalScore / crew.finishTarget) * 100)
    : 0;

  const metrics = [
    { label: 'Дистрибуция', fact: crew.metrics.distribution.fact, target: crew.metrics.distribution.target, color: '#ff3366', icon: '📊' },
    { label: 'Контракты', fact: crew.metrics.contracts.fact, target: crew.metrics.contracts.target, color: '#00d4ff', icon: '📝' },
    { label: 'Лига Про', fact: crew.metrics.ligaPro.fact, target: crew.metrics.ligaPro.target, color: '#a855f7', icon: '🏆' },
    { label: 'Контакты', fact: crew.metrics.contacts.fact, target: crew.metrics.contacts.target, color: '#00ff88', icon: '📞' },
  ];

  const [animated, setAnimated] = useState(false);
  const [countProgress, setCountProgress] = useState(0); // 0..1
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  useEffect(() => {
    const tAnim = setTimeout(() => setAnimated(true), 50);

    // Animate counter from 0 to 1 over ~1.2s
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start - 50; // account for 50ms delay
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setCountProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => { clearTimeout(tAnim); cancelAnimationFrame(raf); };
  }, []);

  return (
    <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '8px' : '20px',
        overflowY: 'auto',
      }} onClick={onClose}>
      <motion.div
        className="detail-modal"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: isMobile ? '14px' : '20px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: isMobile ? 'calc(100vh - 16px)' : 'calc(100vh - 40px)',
          overflowY: 'auto',
          position: 'relative',
          borderTop: `3px solid ${crew.color}`,
          boxShadow: `0 0 60px ${crew.glowColor}, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '12px', right: '14px', zIndex: 10,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', fontSize: '18px', cursor: 'pointer', lineHeight: 1,
          width: '32px', height: '32px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>×</button>

        {/* Header */}
        <div style={{
          padding: isMobile ? '14px 14px 12px' : '20px 24px 16px',
          display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: isMobile ? '38px' : '48px', height: isMobile ? '38px' : '48px', borderRadius: '12px',
            background: `${crew.color}15`, border: `2px solid ${crew.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Orbitron, sans-serif', fontSize: isMobile ? '14px' : '18px', fontWeight: '700',
            color: crew.color, flexShrink: 0,
          }}>
            #{rank}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: isMobile ? '14px' : '18px', fontWeight: '700',
              color: crew.color, letterSpacing: '2px', textTransform: 'uppercase', margin: 0,
            }}>{crew.teamName}</h2>
            <p style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-secondary)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="#ff4466" style={{ flexShrink: 0 }}>
                <circle cx="6" cy="3" r="2.5"/><path d="M1.5 11.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"/>
              </svg>
              {crew.driver.name} · <svg width="11" height="11" viewBox="0 0 12 12" fill="#00d4ff" style={{ flexShrink: 0 }}>
                <circle cx="6" cy="3" r="2.5"/><path d="M1.5 11.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"/>
              </svg>
              {crew.navigator.name}
            </p>
          </div>
          <VoteButton crewId={crew.id} color={crew.color} />
        </div>

        {/* Main content: video + metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '0',
          minHeight: isMobile ? 'auto' : '340px',
        }}>

          {/* LEFT — Video */}
          <div style={{
            padding: isMobile ? '12px 12px 0' : '20px 12px 20px 24px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              borderRadius: '14px',
              overflow: 'hidden',
              flex: 1,
              background: '#000',
              border: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
            }}>
              <video
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Crew name overlay on video */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 14px 10px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: crew.color, boxShadow: `0 0 8px ${crew.color}`,
                }} />
                <span style={{
                  fontSize: '11px', color: '#fff', fontFamily: 'Orbitron, sans-serif',
                  fontWeight: '600', letterSpacing: '1px', opacity: 0.9,
                }}>
                  ЭКИПАЖ {crew.teamName.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — KPI Cards */}
          <div style={{
            padding: isMobile ? '12px' : '20px 24px 20px 12px',
            display: 'flex', flexDirection: 'column',
            gap: isMobile ? '8px' : '10px',
          }}>
            {/* Overall progress */}
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '10px' : '14px',
              borderRadius: isMobile ? '10px' : '14px',
              background: `linear-gradient(135deg, ${crew.color}08, ${crew.color}15)`,
              border: `1px solid ${crew.color}30`,
            }}>
              <div style={{
                fontFamily: 'Orbitron, sans-serif', fontSize: isMobile ? '24px' : '32px', fontWeight: '900',
                color: crew.color,
                lineHeight: 1,
              }}>
                {Math.round(crew.totalScore * countProgress)} <span style={{ fontSize: isMobile ? '13px' : '16px', opacity: 0.6 }}>/ {crew.finishTarget}</span>
              </div>
              <div style={{
                fontSize: '10px', color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '2px', marginTop: '6px',
              }}>
                Общий счёт · {Math.round(overallPct * countProgress)}%
              </div>
            </div>

            {/* Metric cards */}
            {metrics.map((m) => {
              const pct = m.target > 0 ? Math.round((m.fact / m.target) * 100) : 0;
              const isComplete = pct >= 100;
              return (
                <div key={m.label} style={{
                  padding: isMobile ? '10px 12px' : '12px 16px',
                  borderRadius: isMobile ? '10px' : '14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Subtle colored left accent */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '3px', background: m.color,
                    boxShadow: `0 0 8px ${m.color}40`,
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{
                        fontSize: '10px', color: 'var(--text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '1px',
                      }}>
                        {m.icon} {m.label}
                      </div>
                      <div style={{
                        fontFamily: 'Orbitron, sans-serif', fontSize: isMobile ? '16px' : '20px', fontWeight: '700',
                        color: m.color, marginTop: '4px',
                      }}>
                        {Math.round(m.fact * countProgress).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fontWeight: '700',
                      color: isComplete ? 'var(--accent-green)' : pct >= 70 ? 'var(--accent-gold)' : 'var(--accent-primary)',
                      marginTop: '14px',
                    }}>
                      {Math.round(pct * countProgress)}%
                    </div>
                  </div>

                  {/* Fuel gauge */}
                  <div style={{ marginTop: '8px' }}>
                    {/* Scale labels */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '8px', color: 'var(--text-secondary)', marginBottom: '3px',
                      fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.5px', opacity: 0.6,
                    }}>
                      <span>0</span>
                      <span>План: {m.target.toLocaleString('ru-RU')}</span>
                    </div>
                    {/* Gauge track */}
                    <div style={{
                      height: '14px',
                      borderRadius: '7px',
                      background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 9%, transparent 9%, transparent 10%)`,
                      border: '1px solid rgba(255,255,255,0.08)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {/* Fill */}
                      <div style={{
                        position: 'absolute', top: '1px', bottom: '1px', left: '1px',
                        width: animated ? `calc(${Math.min(pct, 100)}% - 2px)` : '0%',
                        borderRadius: '6px',
                        background: `linear-gradient(90deg, ${m.color}40, ${m.color}90, ${m.color})`,
                        boxShadow: isComplete
                          ? `0 0 12px ${m.color}80, inset 0 1px 0 rgba(255,255,255,0.2)`
                          : `0 0 8px ${m.color}50, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        transition: 'width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        animation: isComplete && animated ? 'gaugePulse 2s ease-in-out infinite' : undefined,
                      }} />
                      {/* Needle marker at fill edge */}
                      {pct > 3 && pct <= 100 && (
                        <div style={{
                          position: 'absolute',
                          left: animated ? `${Math.min(pct, 100)}%` : '0%',
                          top: '0', bottom: '0',
                          width: '2px',
                          background: '#fff',
                          boxShadow: `0 0 6px #fff, 0 0 12px ${m.color}`,
                          transform: 'translateX(-2px)',
                          borderRadius: '1px',
                          transition: 'left 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          opacity: animated ? 1 : 0,
                        }} />
                      )}
                      {/* Tick marks overlay */}
                      {[25, 50, 75].map(tick => (
                        <div key={tick} style={{
                          position: 'absolute',
                          left: `${tick}%`,
                          top: '2px', bottom: '2px',
                          width: '1px',
                          background: 'rgba(255,255,255,0.1)',
                        }} />
                      ))}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '10px', marginTop: '4px', fontWeight: '600',
                    color: isComplete ? 'var(--accent-green)' : pct >= 70 ? 'var(--accent-gold)' : 'var(--accent-primary)',
                  }}>
                    {isComplete ? '✓ План выполнен!' : pct >= 70 ? '~ На курсе' : '⚠ Отстаёт'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Awards section — bottom */}
        {crew.awards && crew.awards.length > 0 && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 24px 20px',
          }}>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '14px',
              textAlign: 'center',
            }}>
              Награды
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {crew.awards.map((award, i) => (
                <AwardBadge key={award.label + award.month} award={award} index={i} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
}
