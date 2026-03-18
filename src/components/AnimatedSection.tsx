import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

const directionMap = {
  up: { y: 60, x: 0 },
  down: { y: -60, x: 0 },
  left: { x: 80, y: 0 },
  right: { x: -80, y: 0 },
};

// Reduced offsets for mobile — lighter animations
const directionMapMobile = {
  up: { y: 20, x: 0 },
  down: { y: -20, x: 0 },
  left: { x: 30, y: 0 },
  right: { x: -30, y: 0 },
};

export default function AnimatedSection({
  children,
  delay = 0,
  direction = 'up',
  className,
}: AnimatedSectionProps) {
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);
  const offset = isMobile ? directionMapMobile[direction] : directionMap[direction];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: isMobile ? '-30px' : '-80px' }}
      transition={{
        duration: isMobile ? 0.4 : 0.7,
        delay: isMobile ? Math.min(delay, 0.05) : delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
