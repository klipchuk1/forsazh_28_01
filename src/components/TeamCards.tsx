import React from 'react';
import { motion } from 'framer-motion';
import type { Crew } from '../data/types';
import VoteButton from './VoteButton';

interface TeamCardsProps {
  crews: Crew[];
  onCrewClick: (crew: Crew) => void;
}

function getBarStatus(fact: number, target: number): 'on-track' | 'behind' | 'ahead' {
  if (target <= 0) return 'behind';
  const ratio = fact / target;
  if (ratio >= 1) return 'ahead';
  if (ratio >= 0.7) return 'on-track';
  return 'behind';
}

function getRank(crews: Crew[], crewId: number): number {
  const sorted = [...crews].sort((a, b) => b.totalScore - a.totalScore);
  return sorted.findIndex((c) => c.id === crewId) + 1;
}

export default function TeamCards({ crews, onCrewClick }: TeamCardsProps) {
  return (
    <div>
      <div className="section-header">
        <span className="section-title">🚗 Экипажи</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
          {crews.length} экипажей
        </span>
      </div>
      <div className="team-cards-grid">
        {crews.map((crew, index) => {
          const rank = getRank(crews, crew.id);
          const distPct = crew.metrics.distribution.target > 0
            ? Math.round((crew.metrics.distribution.fact / crew.metrics.distribution.target) * 100) : 0;
          const contractsPct = crew.metrics.contracts.target > 0
            ? Math.round((crew.metrics.contracts.fact / crew.metrics.contracts.target) * 100) : 0;
          const ligaPct = crew.metrics.ligaPro.target > 0
            ? Math.round((crew.metrics.ligaPro.fact / crew.metrics.ligaPro.target) * 100) : 0;
          const contactsPct = crew.metrics.contacts.target > 0
            ? Math.round((crew.metrics.contacts.fact / crew.metrics.contacts.target) * 100) : 0;

          return (
            <motion.div
              key={crew.id}
              className="team-card"
              style={{
                '--card-color': crew.color,
                '--card-glow': crew.glowColor,
              } as React.CSSProperties}
              onClick={() => onCrewClick(crew)}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: index * 0.04,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="team-card-header">
                <div className="team-card-avatars">
                  <img className="team-card-avatar" src={`${crew.driver.avatar}?v=2`} alt={crew.driver.name} />
                  <img className="team-card-avatar" src={`${crew.navigator.avatar}?v=2`} alt={crew.navigator.name} />
                </div>
                <div className="team-card-info">
                  <div className="team-card-name">{crew.teamName}</div>
                  <div className="team-card-members">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#ff4466" style={{ verticalAlign: '-1px', marginRight: '2px' }}>
                      <circle cx="6" cy="3" r="2.5"/><path d="M1.5 11.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"/>
                    </svg>
                    {crew.driver.name.split(' ')[0]} · <svg width="12" height="12" viewBox="0 0 12 12" fill="#00d4ff" style={{ verticalAlign: '-1px', marginRight: '2px' }}>
                      <circle cx="6" cy="3" r="2.5"/><path d="M1.5 11.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"/>
                    </svg>
                    {crew.navigator.name.split(' ')[0]}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <VoteButton crewId={crew.id} color={crew.color} />
                  <div className="team-card-rank">#{rank}</div>
                </div>
              </div>

              {/* Score badge */}
              <div style={{
                textAlign: 'center', padding: '6px', margin: '0 0 6px',
                fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fontWeight: '700',
                color: crew.color,
              }}>
                {crew.totalScore} <span style={{ fontSize: '11px', opacity: 0.6 }}>/ {crew.finishTarget}</span>
              </div>

              <div className="team-card-metrics">
                <div className="metric-mini">
                  <div className="metric-mini-value">{crew.metrics.distribution.fact}</div>
                  <div className="metric-mini-label">Дистриб.</div>
                  <div className="metric-mini-bar">
                    <div
                      className={`metric-mini-bar-fill ${getBarStatus(crew.metrics.distribution.fact, crew.metrics.distribution.target)}`}
                      style={{ width: `${Math.min(distPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="metric-mini">
                  <div className="metric-mini-value">{crew.metrics.contracts.fact}</div>
                  <div className="metric-mini-label">Контракты</div>
                  <div className="metric-mini-bar">
                    <div
                      className={`metric-mini-bar-fill ${getBarStatus(crew.metrics.contracts.fact, crew.metrics.contracts.target)}`}
                      style={{ width: `${Math.min(contractsPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="metric-mini">
                  <div className="metric-mini-value">{crew.metrics.ligaPro.fact}</div>
                  <div className="metric-mini-label">ЛигаПро</div>
                  <div className="metric-mini-bar">
                    <div
                      className={`metric-mini-bar-fill ${getBarStatus(crew.metrics.ligaPro.fact, crew.metrics.ligaPro.target)}`}
                      style={{ width: `${Math.min(ligaPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="metric-mini">
                  <div className="metric-mini-value">{crew.metrics.contacts.fact}</div>
                  <div className="metric-mini-label">Контакты</div>
                  <div className="metric-mini-bar">
                    <div
                      className={`metric-mini-bar-fill ${getBarStatus(crew.metrics.contacts.fact, crew.metrics.contacts.target)}`}
                      style={{ width: `${Math.min(contactsPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
