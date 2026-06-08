// src/components/workout/WorkoutModeSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';

export type WorkoutMode = 'classic' | 'amrap' | 'emom' | 'mobility';

interface ModeConfig {
  id: WorkoutMode;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  color: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'classic',
    label: 'Clássico',
    shortLabel: 'SÉRIES',
    icon: '🏋️',
    description: 'Séries × Reps',
    color: '#e8c84a',
  },
  {
    id: 'amrap',
    label: 'AMRAP',
    shortLabel: 'AMRAP',
    icon: '⏱️',
    description: 'Máx. Rondas',
    color: '#f97316',
  },
  {
    id: 'emom',
    label: 'EMOM',
    shortLabel: 'EMOM',
    icon: '⏲️',
    description: 'Min a Minuto',
    color: '#38bdf8',
  },
  {
    id: 'mobility',
    label: 'Mobilidade',
    shortLabel: 'MOBIL',
    icon: '🧘',
    description: 'Tempo Tensão',
    color: '#a78bfa',
  },
];

interface Props {
  mode: WorkoutMode;
  onChange: (mode: WorkoutMode) => void;
}

export function WorkoutModeSelector({ mode, onChange }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p
        style={{
          fontSize: 10,
          color: '#55626e',
          letterSpacing: 2,
          fontWeight: 700,
          marginBottom: 8,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        MODO DE TREINO
      </p>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <motion.button
              key={m.id}
              onClick={() => onChange(m.id)}
              whileTap={{ scale: 0.93 }}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '8px 14px',
                borderRadius: 12,
                border: `1px solid ${isActive ? m.color : 'rgba(255,255,255,0.08)'}`,
                background: isActive
                  ? `linear-gradient(135deg, ${m.color}22, ${m.color}11)`
                  : 'rgba(18, 25, 35, 0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 16px ${m.color}33` : 'none',
                minWidth: 72,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{m.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'Bebas Neue', cursive",
                  letterSpacing: 1.5,
                  color: isActive ? m.color : '#55626e',
                }}
              >
                {m.shortLabel}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: isActive ? `${m.color}cc` : '#3a4550',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {m.description}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
