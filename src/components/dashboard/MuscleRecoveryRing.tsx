import { AnimatePresence, motion } from 'framer-motion';
// @ts-nocheck
import type React from 'react';
import { useState } from 'react';
import { C } from '../../data/constants';

interface RecoveryData {
  muscle: string;
  lastTrained: Date | null;
  recoveryPercentage: number;
  hoursLeft: number;
  color: string;
}

interface Props {
  recoveryData: RecoveryData[];
}

export const MuscleRecoveryRing: React.FC<Props> = ({ recoveryData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextMuscle = () => {
    setCurrentIndex((prev) => (prev + 1) % recoveryData.length);
  };

  const current = recoveryData[currentIndex];
  if (!current) return null;

  // SVG Ring Calculations
  const size = 160;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (current.recoveryPercentage / 100) * circumference;

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 24,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <p
        style={{
          fontFamily: "'Bebas Neue'",
          fontSize: 20,
          letterSpacing: 2,
          color: C.text,
          marginBottom: 16,
        }}
      >
        RECUPERAÇÃO MUSCULAR
      </p>

      <div
        onClick={nextMuscle}
        style={{ cursor: 'pointer', position: 'relative', width: size, height: size }}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={C.dim}
            strokeWidth={strokeWidth}
          />
          <motion.circle
            key={current.muscle} // Animate on change
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={current.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.muscle}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{ textAlign: 'center' }}
            >
              <span style={{ fontSize: 32 }}>{current.recoveryPercentage}%</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev === 0 ? recoveryData.length - 1 : prev - 1))
            }
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ◀
          </button>
          <p style={{ fontSize: 18, fontWeight: 600, color: current.color, width: 100 }}>
            {current.muscle}
          </p>
          <button
            onClick={nextMuscle}
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ▶
          </button>
        </div>

        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          {current.recoveryPercentage >= 100
            ? 'Totalmente recuperado!'
            : `${current.hoursLeft}h até recuperação total`}
        </p>
      </div>
    </div>
  );
};
