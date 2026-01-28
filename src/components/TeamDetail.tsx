import React from 'react';
import type { Crew } from '../data/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface TeamDetailProps {
  crew: Crew;
  crews: Crew[];
  onClose: () => void;
}

export default function TeamDetail({ crew, crews, onClose }: TeamDetailProps) {
  const weeklyData = crew.weeklyHistory.map((w) => ({
    name: `W${w.week}`,
    Факт: w.connectedPoints,
    План: Math.round(crew.metrics.connectedPoints.target * (w.week / 12)),
  }));

  const radarData = [
    {
      metric: 'Точки',
      value: Math.round((crew.metrics.connectedPoints.fact / crew.metrics.connectedPoints.target) * 100),
      full: 100,
    },
    {
      metric: 'Продажи',
      value: Math.round((crew.metrics.salesVolume.fact / crew.metrics.salesVolume.target) * 100),
      full: 100,
    },
    {
      metric: 'СКЮ',
      value: Math.round((crew.metrics.skuCount.fact / crew.metrics.skuCount.target) * 100),
      full: 100,
    },
  ];

  const rank = [...crews]
    .sort((a, b) => b.metrics.connectedPoints.fact / b.metrics.connectedPoints.target - a.metrics.connectedPoints.fact / a.metrics.connectedPoints.target)
    .findIndex((c) => c.id === crew.id) + 1;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '32px', maxWidth: '800px', width: '100%',
        maxHeight: '85vh', overflowY: 'auto', position: 'relative',
        borderTop: `3px solid ${crew.color}`,
        boxShadow: `0 0 40px ${crew.glowColor}`,
      }} onClick={(e) => e.stopPropagation()}>

        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: '24px', cursor: 'pointer', lineHeight: 1,
        }}>×</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '12px',
            background: `${crew.color}20`, border: `2px solid ${crew.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: '700',
            color: crew.color,
          }}>
            #{rank}
          </div>
          <div>
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: '700',
              color: crew.color, letterSpacing: '2px', textTransform: 'uppercase',
            }}>{crew.teamName}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              🚗 {crew.driver.name} · 🧭 {crew.navigator.name}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '28px', fontWeight: '900',
              color: crew.color,
            }}>
              {Math.round((crew.metrics.connectedPoints.fact / crew.metrics.connectedPoints.target) * 100)}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Overall Progress
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Подключённые точки', fact: crew.metrics.connectedPoints.fact, target: crew.metrics.connectedPoints.target, color: '#ff3366' },
            { label: 'Объём продаж', fact: crew.metrics.salesVolume.fact, target: crew.metrics.salesVolume.target, color: '#00d4ff' },
            { label: 'Количество СКЮ', fact: crew.metrics.skuCount.fact, target: crew.metrics.skuCount.target, color: '#a855f7' },
          ].map((m) => {
            const pct = Math.round((m.fact / m.target) * 100);
            return (
              <div key={m.label} style={{
                background: 'var(--bg-secondary)', borderRadius: '10px',
                padding: '16px', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: '700', color: m.color }}>
                  {m.fact.toLocaleString('ru-RU')}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  План: {m.target.toLocaleString('ru-RU')}
                </div>
                <div style={{ marginTop: '8px', height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(pct, 100)}%`,
                    background: m.color, borderRadius: '2px',
                    boxShadow: `0 0 8px ${m.color}60`,
                    transition: 'width 1s ease',
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: pct >= 100 ? 'var(--accent-green)' : pct >= 70 ? 'var(--accent-gold)' : 'var(--accent-primary)', marginTop: '4px', fontWeight: '600' }}>
                  {pct}% {pct >= 100 ? '✓ План выполнен!' : pct >= 70 ? '~ На курсе' : '⚠ Отстаёт'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
          {/* Weekly progress chart */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '10px',
            padding: '16px', border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              📈 Динамика по неделям
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff15', borderRadius: '8px', color: '#f0f0ff' }}
                  labelStyle={{ color: '#8888aa' }}
                />
                <Bar dataKey="План" fill="#ffffff10" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Факт" fill={crew.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '10px',
            padding: '16px', border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              🎯 Профиль KPI
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#8888aa', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 120]} tick={{ fill: '#8888aa', fontSize: 9 }} />
                <Radar name="Факт" dataKey="value" stroke={crew.color} fill={crew.color} fillOpacity={0.2} />
                <Radar name="План" dataKey="full" stroke="#ffffff20" fill="transparent" strokeDasharray="4 4" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
