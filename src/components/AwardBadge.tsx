import { motion } from 'framer-motion';
import type { Award } from '../data/types';

interface AwardBadgeProps {
  award: Award;
  index: number;
}

const placeThemes = {
  1: {
    border: 'rgba(255, 215, 0, 0.7)',
    glow: 'rgba(255, 215, 0, 0.35)',
    glowStrong: 'rgba(255, 215, 0, 0.6)',
    accent: '#FFD700',
    gradient: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(184,134,11,0.08) 100%)',
    placeColor: '#FFD700',
    shimmer: 'rgba(255, 230, 100, 0.4)',
  },
  2: {
    border: 'rgba(192, 192, 192, 0.6)',
    glow: 'rgba(192, 192, 192, 0.25)',
    glowStrong: 'rgba(220, 220, 220, 0.5)',
    accent: '#D0D0D0',
    gradient: 'linear-gradient(135deg, rgba(192,192,192,0.12) 0%, rgba(128,128,128,0.06) 100%)',
    placeColor: '#E0E0E0',
    shimmer: 'rgba(220, 220, 240, 0.35)',
  },
  3: {
    border: 'rgba(205, 127, 50, 0.6)',
    glow: 'rgba(205, 127, 50, 0.25)',
    glowStrong: 'rgba(205, 127, 50, 0.5)',
    accent: '#CD7F32',
    gradient: 'linear-gradient(135deg, rgba(205,127,50,0.15) 0%, rgba(139,69,19,0.08) 100%)',
    placeColor: '#DDA05C',
    shimmer: 'rgba(220, 180, 100, 0.35)',
  },
  0: {
    border: 'rgba(255, 215, 0, 0.8)',
    glow: 'rgba(255, 140, 0, 0.35)',
    glowStrong: 'rgba(255, 180, 0, 0.6)',
    accent: '#FFB800',
    gradient: 'linear-gradient(135deg, rgba(255,215,0,0.18) 0%, rgba(255,140,0,0.1) 50%, rgba(255,215,0,0.18) 100%)',
    placeColor: '#FFD700',
    shimmer: 'rgba(255, 200, 50, 0.5)',
  },
};

const categoryShort: Record<string, string> = {
  'дистрибуция': 'Дистрибуция',
  'контрактование': 'Контракты',
  'ЛигеПро': 'ЛигаПро',
  'инфо контакты': 'Инфо',
  'объём продаж': 'Продажи',
  'количество точек': 'Точки',
  'лидер месяца': 'Лидер',
};

// Inject keyframes once
const styleId = 'award-badge-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes awardShine {
      0% { transform: translateX(-100%) rotate(25deg); }
      100% { transform: translateX(200%) rotate(25deg); }
    }
    @keyframes awardGlowPulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

export default function AwardBadge({ award, index }: AwardBadgeProps) {
  const theme = placeThemes[award.place as keyof typeof placeThemes] || placeThemes[3];
  const isLeader = award.place === 0;
  const displayPlace = isLeader ? '\u2605' : `#${award.place}`;
  const shortCategory = categoryShort[award.category] || award.category;

  const baseDelay = 0.6 + index * 0.2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotateX: 60, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: baseDelay,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      whileHover={{ y: -6, scale: 1.05 }}
      style={{
        perspective: '600px',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'default',
      }}
      title={award.label}
    >
      <div style={{
        width: '100px',
        minHeight: '110px',
        borderRadius: '16px',
        background: theme.gradient,
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${theme.border}`,
        boxShadow: `
          0 0 20px ${theme.glow},
          0 0 40px ${theme.glow},
          inset 0 1px 0 rgba(255,255,255,0.1),
          0 8px 32px rgba(0,0,0,0.4)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 8px 10px',
        position: 'relative',
        overflow: 'hidden',
        animation: `awardGlowPulse 2s ease-in-out ${baseDelay + 0.5}s 2`,
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `
          0 0 30px ${theme.glowStrong},
          0 0 60px ${theme.glow},
          inset 0 1px 0 rgba(255,255,255,0.15),
          0 12px 40px rgba(0,0,0,0.5)
        `;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `
          0 0 20px ${theme.glow},
          0 0 40px ${theme.glow},
          inset 0 1px 0 rgba(255,255,255,0.1),
          0 8px 32px rgba(0,0,0,0.4)
        `;
      }}
      >
        {/* Diagonal shine sweep */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '40%',
            height: '200%',
            background: `linear-gradient(90deg, transparent, ${theme.shimmer}, transparent)`,
            animation: `awardShine 1.2s ease-in-out ${baseDelay + 0.8}s 1`,
            transform: 'translateX(-100%) rotate(25deg)',
          }} />
        </div>

        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
          borderRadius: '0 0 2px 2px',
        }} />

        {/* Place number */}
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: isLeader ? '28px' : '32px',
          fontWeight: 900,
          color: theme.placeColor,
          textShadow: `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`,
          lineHeight: 1,
          marginBottom: '6px',
        }}>
          {displayPlace}
        </div>

        {/* Category */}
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          {shortCategory}
        </div>

        {/* Month tag */}
        <div style={{
          marginTop: '8px',
          padding: '2px 10px',
          borderRadius: '8px',
          background: `${theme.accent}18`,
          border: `1px solid ${theme.accent}30`,
          fontSize: '9px',
          fontWeight: 700,
          color: theme.accent,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {award.month}
        </div>
      </div>
    </motion.div>
  );
}
