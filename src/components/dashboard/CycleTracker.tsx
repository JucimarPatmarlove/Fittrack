// @ts-nocheck
// src/components/dashboard/CycleTracker.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { DemographicEngine, CyclePhase } from '../../services/demographicEngine';

const PHASE_CONFIG: Record<
  CyclePhase,
  { label: string; color: string; emoji: string; tip: string }
> = {
  menstrual: {
    label: 'Menstrual',
    color: '#ef4444',
    emoji: '🌙',
    tip: 'Intensidade reduzida. Foco em mobilidade e recuperação ativa.',
  },
  follicular: {
    label: 'Folicular',
    color: '#22c55e',
    emoji: '🌱',
    tip: 'Energia a subir. Ideal para força e treinos mais intensos.',
  },
  ovulatory: {
    label: 'Ovulatória',
    color: '#f97316',
    emoji: '⚡',
    tip: 'Pico de energia. Ótimo momento para PRs e alta intensidade!',
  },
  luteal: {
    label: 'Lútea',
    color: '#a78bfa',
    emoji: '🌒',
    tip: 'Energia a descer. Treino moderado, foco em técnica.',
  },
};

export function CycleTracker() {
  const savedDay = parseInt(localStorage.getItem('fit_cycle_day') || '1', 10);
  const [cycleDay, setCycleDay] = useState(savedDay);
  const phase = DemographicEngine.getCyclePhaseFromDay(cycleDay);
  const intensityFactor = DemographicEngine.getCycleIntensityFactor(phase);
  const config = PHASE_CONFIG[phase];

  const handleDayChange = (day: number) => {
    setCycleDay(day);
    localStorage.setItem('fit_cycle_day', String(day));
  };

  return (
    <GlassCard
      style={{
        padding: 20,
        marginBottom: 16,
        border: `1px solid ${config.color}33`,
        background: `linear-gradient(135deg, ${config.color}08, rgba(18,25,35,0.6))`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              color: config.color,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: 2,
              marginBottom: 2,
            }}
          >
            🔄 CICLO & TREINO
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{config.emoji}</span>
            <span
              style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 20,
                color: config.color,
                letterSpacing: 1,
              }}
            >
              Fase {config.label}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontSize: 10,
              color: '#55626e',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            INTENSIDADE
          </p>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 22,
              color: config.color,
              fontWeight: 700,
            }}
          >
            {Math.round(intensityFactor * 100)}%
          </p>
        </div>
      </div>

      {/* Slider de dia do ciclo */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 11, color: '#55626e' }}>
            Dia do ciclo
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: config.color,
            }}
          >
            Dia {cycleDay} / 28
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={28}
          value={cycleDay}
          onChange={(e) => handleDayChange(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: config.color,
            cursor: 'pointer',
          }}
        />
        {/* Indicador visual das fases no slider */}
        <div
          style={{
            display: 'flex',
            marginTop: 4,
            borderRadius: 4,
            overflow: 'hidden',
            height: 4,
          }}
        >
          <div style={{ flex: 5, background: '#ef4444', opacity: 0.6 }} title="Menstrual (1-5)" />
          <div style={{ flex: 8, background: '#22c55e', opacity: 0.6 }} title="Folicular (6-13)" />
          <div style={{ flex: 2, background: '#f97316', opacity: 0.6 }} title="Ovulatória (14-15)" />
          <div style={{ flex: 13, background: '#a78bfa', opacity: 0.6 }} title="Lútea (16-28)" />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 2,
          }}
        >
          {['Mens.', 'Folic.', 'Ov.', 'Lútea'].map((l, i) => (
            <span key={i} style={{ fontSize: 8, color: '#3a4550' }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Dica da fase */}
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: `${config.color}11`,
          border: `1px solid ${config.color}33`,
          borderRadius: 8,
          padding: '8px 12px',
        }}
      >
        <p style={{ fontSize: 12, color: '#eceae4', lineHeight: 1.5 }}>
          💡 {config.tip}
        </p>
      </motion.div>
    </GlassCard>
  );
}
