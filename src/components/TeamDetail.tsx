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
    .sort((a, b) => b.metrics.connectedPoints.fact / b.metrics.connectedPoints.target - a.metrics.connectedPoints.fact / a.metrics.connectedPoints.target)
    .findIndex((c) => c.id === crew.id) + 1;

  const videoSrc = crew.videoUrl || '/crew-sample.mp4';

  const metrics = [
    { label: 'Подключённые точки', fact: crew.metrics.connectedPoints.fact, target: crew.metrics.connectedPoints.target, color: '#ff3366', icon: '📍' },
    { label: 'Объём продаж', fact: crew.metrics.salesVolume.fact, target: crew.metrics.salesVolume.target, color: '#00d4ff', icon: '💰' },
    { label: 'Количество СКЮ', fact: crew.metrics.skuCount.fact, target: crew.metrics.skuCount.target, color: '#a855f7', icon: '📦' },
  ];

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
        padding: '20px',
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
          borderRadius: '20px',
          maxWidth: '900px',
          width: '100%',
          overflow: 'hidden',
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
          padding: '20px 24px 16px',
          display: 'flex', alignItems: 'center', gap: '14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: `${crew.color}15`, border: `2px solid ${crew.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fontWeight: '700',
            color: crew.color, flexShrink: 0,
          }}>
            #{rank}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fontWeight: '700',
              color: crew.color, letterSpacing: '2px', textTransform: 'uppercase', margin: 0,
            }}>{crew.teamName}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {crew.driver.name} · {crew.navigator.name}
            </p>
          </div>
          <VoteButton crewId={crew.id} color={crew.color} />
        </div>

        {/* Awards section */}
        {crew.awards && crew.awards.length > 0 && (
          <div style={{
            padding: '14px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {crew.awards.map((award, i) => (
              <AwardBadge key={award.label + award.month} award={award} index={i} />
            ))}
          </div>
        )}

        {/* Main content: video + metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          minHeight: '340px',
        }}>

          {/* LEFT — Video */}
          <div style={{
            padding: '20px 12px 20px 24px',
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
            padding: '20px 24px 20px 12px',
            display: 'flex', flexDirection: 'column',
            gap: '12px',
          }}>
            {/* Overall progress */}
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${crew.color}08, ${crew.color}15)`,
              border: `1px solid ${crew.color}30`,
            }}>
              <div style={{
                fontFamily: 'Orbitron, sans-serif', fontSize: '36px', fontWeight: '900',
                color: crew.color,
                lineHeight: 1,
              }}>
                {Math.round((crew.metrics.connectedPoints.fact / crew.metrics.connectedPoints.target) * 100)}%
              </div>
              <div style={{
                fontSize: '10px', color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '2px', marginTop: '6px',
              }}>
                Общий прогресс
              </div>
            </div>

            {/* Metric cards */}
            {metrics.map((m) => {
              const pct = Math.round((m.fact / m.target) * 100);
              const isComplete = pct >= 100;
              return (
                <div key={m.label} style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
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
                        fontFamily: 'Orbitron, sans-serif', fontSize: '22px', fontWeight: '700',
                        color: m.color, marginTop: '4px',
                      }}>
                        {m.fact.toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fontWeight: '700',
                      color: isComplete ? 'var(--accent-green)' : pct >= 70 ? 'var(--accent-gold)' : 'var(--accent-primary)',
                      marginTop: '14px',
                    }}>
                      {pct}%
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    План: {m.target.toLocaleString('ru-RU')}
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    marginTop: '8px', height: '4px',
                    background: 'rgba(255,255,255,0.05)', borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      background: `linear-gradient(90deg, ${m.color}, ${m.color}cc)`,
                      borderRadius: '2px',
                      boxShadow: `0 0 10px ${m.color}40`,
                      transition: 'width 0.8s ease',
                    }} />
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
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
}
