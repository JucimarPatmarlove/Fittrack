// src/components/dashboard/VirtualPet.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

const PET_STAGES: {
  minLevel: number;
  emoji: string;
  name: string;
  bg: string;
}[] = [
  { minLevel: 0, emoji: '🥚', name: 'Ovo Misterioso', bg: '#f59e0b' },
  { minLevel: 1, emoji: '🐣', name: 'Pintainho', bg: '#f97316' },
  { minLevel: 3, emoji: '🐥', name: 'Pintocho', bg: '#eab308' },
  { minLevel: 6, emoji: '🐦', name: 'Passarinho', bg: '#22c55e' },
  { minLevel: 10, emoji: '🦅', name: 'Águia', bg: '#38bdf8' },
  { minLevel: 20, emoji: '🐉', name: 'Dragão Lendário', bg: '#a78bfa' },
];

function getPetStage(level: number) {
  let stage = PET_STAGES[0];
  for (const s of PET_STAGES) {
    if (level >= s.minLevel) stage = s;
  }
  return stage;
}

interface Props {
  xp: number;
}

export function VirtualPet({ xp }: Props) {
  const level = Math.floor(xp / 100);
  const xpInLevel = xp % 100;
  const progressPct = xpInLevel;
  const stage = getPetStage(level);
  const [showDetail, setShowDetail] = useState(false);
  const nextStage = PET_STAGES.find((s) => s.minLevel > level);

  return (
    <GlassCard
      style={{
        padding: 20,
        marginBottom: 16,
        border: `1px solid ${stage.bg}33`,
        background: `linear-gradient(135deg, ${stage.bg}08, rgba(18,25,35,0.6))`,
        cursor: 'pointer',
      }}
      onClick={() => setShowDetail((d) => !d)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Mascote animado */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{ fontSize: 44, lineHeight: 1, userSelect: 'none' }}
        >
          {stage.emoji}
        </motion.div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: stage.bg,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: 2,
                }}
              >
                🎮 MASCOTE FITNESS
              </p>
              <p
                style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 18,
                  color: '#eceae4',
                  letterSpacing: 1,
                  lineHeight: 1.1,
                }}
              >
                {stage.name}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  background: `${stage.bg}22`,
                  color: stage.bg,
                  border: `1px solid ${stage.bg}55`,
                  borderRadius: 10,
                  padding: '3px 10px',
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 14,
                  letterSpacing: 1,
                }}
              >
                LVL {level}
              </span>
            </div>
          </div>

          {/* Barra XP */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#55626e', marginBottom: 4 }}>
            <span>XP</span>
            <span style={{ fontFamily: "'DM Mono', monospace", color: stage.bg }}>
              {xpInLevel} / 100
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${stage.bg}, ${stage.bg}aa)`,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p style={{ fontSize: 12, color: '#55626e', marginBottom: 8 }}>
                Treina para alimentar o teu mascote e fazê-lo crescer! 🌟
              </p>
              <p style={{ fontSize: 11, color: '#eceae4' }}>
                📊 Total XP: <strong style={{ color: stage.bg }}>{xp}</strong> pontos
              </p>
              {nextStage && (
                <p style={{ fontSize: 11, color: '#55626e', marginTop: 4 }}>
                  Próxima evolução em{' '}
                  <strong style={{ color: stage.bg }}>
                    {(nextStage.minLevel - level) * 100} XP
                  </strong>{' '}
                  → {nextStage.emoji} {nextStage.name}
                </p>
              )}
              {!nextStage && (
                <p style={{ fontSize: 11, color: stage.bg, marginTop: 4, fontWeight: 'bold' }}>
                  🏆 Nível máximo atingido! És uma lenda!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
