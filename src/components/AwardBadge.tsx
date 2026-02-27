import { motion } from 'framer-motion';
import type { Award } from '../data/types';

interface AwardBadgeProps {
  award: Award;
  index: number;
}

// Color schemes for places
const placeColors = {
  1: { bg1: '#FFD700', bg2: '#B8860B', border: '#FFE44D', text: '#7A5C00', label: '#8B6914' },
  2: { bg1: '#C0C0C0', bg2: '#808080', border: '#E0E0E0', text: '#4A4A4A', label: '#666' },
  3: { bg1: '#CD7F32', bg2: '#8B4513', border: '#DDA05C', text: '#5C2D00', label: '#7A4A1A' },
  0: { bg1: '#FFD700', bg2: '#FF8C00', border: '#FFE44D', text: '#7A3F00', label: '#8B5A00' }, // Лидер месяца
};

// Short labels for categories
const categoryShort: Record<string, string> = {
  'дистрибуция': 'Дистрибуция',
  'контрактование': 'Контракты',
  'ЛигеПро': 'ЛигаПро',
  'инфо контакты': 'Инфо',
  'объём продаж': 'Продажи',
  'количество точек': 'Точки',
  'лидер месяца': 'Лидер',
};

export default function AwardBadge({ award, index }: AwardBadgeProps) {
  const colors = placeColors[award.place as keyof typeof placeColors] || placeColors[3];
  const isLeader = award.place === 0;
  const displayPlace = isLeader ? '★' : `#${award.place}`;
  const shortCategory = categoryShort[award.category] || award.category;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.12,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      whileHover={{ scale: 1.1, y: -4 }}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', cursor: 'default' }}
      title={award.label}
    >
      <svg width="72" height="88" viewBox="0 0 72 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Main shield gradient */}
          <linearGradient id={`shield-${index}`} x1="0" y1="0" x2="72" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={colors.bg1} />
            <stop offset="50%" stopColor={colors.bg2} />
            <stop offset="100%" stopColor={colors.bg1} />
          </linearGradient>
          {/* Inner face gradient (lighter) */}
          <linearGradient id={`face-${index}`} x1="36" y1="8" x2="36" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFEF5" />
            <stop offset="40%" stopColor="#FFF8E1" />
            <stop offset="100%" stopColor="#F5E6C8" />
          </linearGradient>
          {/* Metallic sheen */}
          <linearGradient id={`sheen-${index}`} x1="0" y1="0" x2="72" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {isLeader && (
            <linearGradient id={`leader-${index}`} x1="0" y1="0" x2="72" y2="88" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="25%" stopColor="#FF8C00" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="75%" stopColor="#FF8C00" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          )}
        </defs>

        {/* Shield outline shape */}
        <path
          d="M4 6 C4 4 6 2 8 2 L64 2 C66 2 68 4 68 6 L68 52 C68 58 60 68 36 82 C12 68 4 58 4 52 Z"
          fill={`url(#shield-${index})`}
          stroke={colors.border}
          strokeWidth="1.5"
        />

        {/* Inner face (lighter area) */}
        <path
          d="M8 10 C8 8 10 6 12 6 L60 6 C62 6 64 8 64 10 L64 50 C64 55 57 63 36 76 C15 63 8 55 8 50 Z"
          fill={`url(#face-${index})`}
        />

        {/* Horizontal divider band */}
        <rect x="8" y="48" width="56" height="12" rx="0" fill={isLeader ? `url(#leader-${index})` : `url(#shield-${index})`} opacity="0.9" />

        {/* Metallic sheen overlay */}
        <path
          d="M4 6 C4 4 6 2 8 2 L64 2 C66 2 68 4 68 6 L68 52 C68 58 60 68 36 82 C12 68 4 58 4 52 Z"
          fill={`url(#sheen-${index})`}
        />

        {/* Place number / star */}
        <text
          x="36"
          y="38"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Orbitron', sans-serif"
          fontSize={isLeader ? '22' : '28'}
          fontWeight="900"
          fill={colors.text}
          opacity="0.9"
        >
          {displayPlace}
        </text>

        {/* Category label on the band */}
        <text
          x="36"
          y="56"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Rajdhani', sans-serif"
          fontSize="8"
          fontWeight="700"
          fill="#fff"
          letterSpacing="0.5"
        >
          {shortCategory.toUpperCase()}
        </text>

        {/* Laurel wreath arcs for leader */}
        {isLeader && (
          <>
            <path d="M14 44 Q18 36 24 40" stroke={colors.bg2} strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M14 40 Q18 32 24 36" stroke={colors.bg2} strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M58 44 Q54 36 48 40" stroke={colors.bg2} strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M58 40 Q54 32 48 36" stroke={colors.bg2} strokeWidth="1.2" fill="none" opacity="0.6" />
          </>
        )}

        {/* Small decorative dots at top corners */}
        <circle cx="14" cy="10" r="2" fill={colors.border} opacity="0.4" />
        <circle cx="58" cy="10" r="2" fill={colors.border} opacity="0.4" />
      </svg>

      {/* Month label below */}
      <span style={{
        fontSize: '9px',
        color: 'var(--text-secondary)',
        marginTop: '2px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}>
        {award.month}
      </span>
    </motion.div>
  );
}
