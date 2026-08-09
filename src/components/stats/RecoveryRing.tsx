// @ts-nocheck
import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../../data/constants';

interface RecoveryData {
  muscle: string;
  emoji: string;
  recoveryPct: number;
  hoursLeft: number;
}

const R = 100, CIRC = 2 * Math.PI * R;

function getColor(pct: number) {
  if (pct > 80) return C.green;
  if (pct > 40) return C.accent;
  return C.red;
}

function getLabel(pct: number) {
  if (pct > 80) return 'Recuperado';
  if (pct > 40) return 'Em recuperação';
  return 'Fadigado';
}

export const RecoveryRing = memo(function RecoveryRingComponent({ recoveryData }: { recoveryData: RecoveryData[] }) {
  const [idx, setIdx] = useState(0);

  // Hooks MUST be called before any conditional return (Rules of Hooks)
  const safeData = recoveryData && recoveryData.length > 0 ? recoveryData : null;
  const current = safeData ? safeData[idx] : null;

  // Memoize os calculos pesados (Dash, circunferência)
  const { dash, color, pct } = useMemo(() => {
     if (!current) return { dash: CIRC, color: '#555', pct: 0 };
     const pct = current.recoveryPct;
     const color = getColor(pct);
     const dash = CIRC * (1 - pct / 100);
     return { dash, color, pct };
  }, [current?.recoveryPct]);

  if (!safeData || !current) return null;



  const next = () => setIdx(i => (i + 1) % recoveryData.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 3, color: C.muted, marginBottom: 12 }}>
        RECUPERAÇÃO MUSCULAR
      </p>

      {/* Ring */}
      <div style={{ position: 'relative', width: 240, height: 240, cursor: 'pointer' }} onClick={next}>
        <svg width={240} height={240} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle cx={120} cy={120} r={R} fill="transparent" stroke={C.dim} strokeWidth={18} strokeLinecap="round" />
          
          {/* Animated Progress */}
          <motion.circle 
            cx={120} cy={120} r={R} fill="transparent"
            stroke={color} strokeWidth={18} strokeLinecap="round"
            strokeDasharray={CIRC} 
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: dash, stroke: color }}
            transition={{ duration: 1, type: 'spring', bounce: 0.2 }}
          />
        </svg>

        {/* Center Text with AnimatePresence */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={current.muscle}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <span style={{ fontSize: 32 }}>{current.emoji}</span>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 2, color: C.text, marginTop: 4 }}>
                {current.muscle.toUpperCase()}
              </p>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 56, color: C.text, lineHeight: 1 }}>
                {pct}<span style={{ fontSize: 20 }}>%</span>
              </p>
              <p style={{ color, fontSize: 13, fontWeight: 600, marginTop: 2 }}>{getLabel(pct)}</p>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 4, maxWidth: 120, lineHeight: 1.3 }}>
                {pct > 80 ? 'Pronto para treinar' : current.hoursLeft > 0 ? `${current.hoursLeft}h restantes` : 'Recuperação em curso'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dot Pagination */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        {recoveryData.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{ 
              width: i === idx ? 24 : 8, 
              height: 8, 
              borderRadius: 4, 
              background: i === idx ? C.text : C.dim, 
              border: 'none', padding: 0, 
              transition: 'all 0.3s ease', cursor: 'pointer' 
            }} 
          />
        ))}
      </div>

      {/* Mini muscle row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, overflowX: 'auto', width: '100%', padding: '0 4px', scrollbarWidth: 'none' }}>
        {recoveryData.map((m, i) => {
          const c = getColor(m.recoveryPct);
          return (
            <button key={i} onClick={() => setIdx(i)}
              style={{ 
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, 
                background: i === idx ? C.card : 'rgba(0,0,0,0)', 
                border: `1px solid ${i === idx ? C.border : 'transparent'}`, 
                borderRadius: 12, padding: '8px 10px',
                cursor: 'pointer', transition: 'background 0.2s'
              }}>
              <span style={{ fontSize: 16 }}>{m.emoji}</span>
              <div style={{ width: 24, height: 4, borderRadius: 2, background: C.dim, overflow: 'hidden' }}>
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${m.recoveryPct}%`, background: c }}
                   transition={{ duration: 0.8 }}
                   style={{ height: '100%', borderRadius: 2 }} 
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
});
