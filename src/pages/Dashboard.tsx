import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles.css';
import type { Crew } from '../data/types';
import { mockCrews } from '../data/mockData';
import StatsBar from '../components/StatsBar';
import Track from '../components/Track';
import Leaderboard from '../components/Leaderboard';
import TeamCards from '../components/TeamCards';
import TeamDetail from '../components/TeamDetail';
import LandingPage from '../components/LandingPage';
import AnimatedSection from '../components/AnimatedSection';
import headerBg from '../assets/header-bg.png';

const SHOW_LANDING = false;

const logoText = 'ФОРСАЖ';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; label: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: '#1a1a2e', border: '1px solid #ff3366', borderRadius: '10px',
          padding: '16px', margin: '8px 0', color: '#fff', fontFamily: 'monospace', fontSize: '13px',
        }}>
          <div style={{ color: '#ff3366', fontWeight: 'bold', marginBottom: '8px' }}>
            ⚠ Ошибка в {this.props.label}:
          </div>
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Dashboard() {
  const [crews] = useState<Crew[]>(mockCrews);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);

  const handleCrewClick = (crew: Crew) => {
    setSelectedCrew(crew);
  };

  if (SHOW_LANDING) return <LandingPage />;

  return (
    <div className="app-container">
      {/* Header with character-by-character logo animation */}
      <motion.div
        className="header"
        style={{ backgroundImage: `url(${headerBg})` }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="header-left">
          <div className="logo-icon">
            <span className="logo-title">
              {logoText.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30, rotateX: 90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + i * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  style={{ display: 'inline-block' }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
            <motion.span
              className="logo-brand"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              itms | sns
            </motion.span>
          </div>
        </div>
        <motion.div
          className="header-badge"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.2, type: 'spring', stiffness: 200 }}
        >
          <span className="pulse-dot"></span>
          На старт
        </motion.div>
      </motion.div>

      <AnimatedSection delay={0.1}>
        <ErrorBoundary label="StatsBar">
          <StatsBar />
        </ErrorBoundary>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <ErrorBoundary label="Track">
          <Track crews={crews} onCrewClick={handleCrewClick} />
        </ErrorBoundary>
      </AnimatedSection>

      <AnimatedSection delay={0.1} direction="left">
        <ErrorBoundary label="Leaderboard">
          <Leaderboard crews={crews} onCrewClick={handleCrewClick} />
        </ErrorBoundary>
      </AnimatedSection>

      <AnimatedSection delay={0.05}>
        <ErrorBoundary label="TeamCards">
          <TeamCards crews={crews} onCrewClick={handleCrewClick} />
        </ErrorBoundary>
      </AnimatedSection>

      {selectedCrew && (
        <ErrorBoundary label="TeamDetail">
          <TeamDetail
            crew={selectedCrew}
            crews={crews}
            onClose={() => setSelectedCrew(null)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
