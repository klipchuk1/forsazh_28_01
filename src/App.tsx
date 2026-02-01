import React, { useState } from 'react';
import './styles.css';
import type { Crew } from './data/types';
import { mockCrews } from './data/mockData';
import StatsBar from './components/StatsBar';
import Track from './components/Track';
import Leaderboard from './components/Leaderboard';
import TeamCards from './components/TeamCards';
import TeamDetail from './components/TeamDetail';
import ExcelImport from './components/ExcelImport';
import CountdownTimer from './components/CountdownTimer';
import LandingPage from './components/LandingPage';
import logoImage from './assets/logo.png';
import headerBg from './assets/header-bg.png';

// Установить в false когда приложение готово к запуску
const SHOW_LANDING = false;

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

export default function App() {
  const [crews, setCrews] = useState<Crew[]>(mockCrews);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);

  const handleCrewClick = (crew: Crew) => {
    setSelectedCrew(crew);
  };

  const handleImport = (updatedCrews: Crew[]) => {
    setCrews(updatedCrews);
  };

  if (SHOW_LANDING) return <LandingPage />;

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header" style={{ backgroundImage: `url(${headerBg})` }}>
        <div className="header-left">
          <div className="logo-icon">
            <img src={logoImage} alt="Форсаж" className="logo-image" />
          </div>
          <div className="header-title">
            <h1>Форсаж</h1>
            <p>Пилот // 3 месяца // 19 экипажей</p>
          </div>
        </div>
        <div className="header-badge">
          <span className="pulse-dot"></span>
          На старт
        </div>
      </div>

      <CountdownTimer />

      <ErrorBoundary label="StatsBar">
        <StatsBar crews={crews} />
      </ErrorBoundary>

      <ErrorBoundary label="ExcelImport">
        <ExcelImport onImport={handleImport} existingCrews={crews} />
      </ErrorBoundary>

      <ErrorBoundary label="Track">
        <Track crews={crews} onCrewClick={handleCrewClick} />
      </ErrorBoundary>

      <ErrorBoundary label="Leaderboard">
        <Leaderboard crews={crews} onCrewClick={handleCrewClick} />
      </ErrorBoundary>

      <ErrorBoundary label="TeamCards">
        <TeamCards crews={crews} onCrewClick={handleCrewClick} />
      </ErrorBoundary>

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
