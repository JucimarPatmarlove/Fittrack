import { motion } from 'framer-motion';
import { Clock, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { C } from '../../data/constants';

interface CircuitProgressProps {
  currentRound: number;
  totalRounds: number;
  restRemaining: number | null;
  onRestComplete: () => void;
}

export const CircuitProgress = ({ 
  currentRound, 
  totalRounds, 
  restRemaining, 
  onRestComplete 
}: CircuitProgressProps) => {
  useEffect(() => {
    if (restRemaining && restRemaining <= 0) {
      onRestComplete();
    }
  }, [restRemaining, onRestComplete]);

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{ background: C.card, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${C.accent}44` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={20} color={C.accent} />
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text }}>CIRCUITO</span>
        </div>
        <span style={{ fontSize: 24, fontWeight: 'bold', color: C.accent }}>
          {currentRound}/{totalRounds}
        </span>
      </div>

      <div style={{ height: 8, background: C.bg, borderRadius: 999, overflow: 'hidden' }}>
        <motion.div 
          style={{ height: '100%', background: C.accent }}
          initial={{ width: 0 }}
          animate={{ width: `${(currentRound / totalRounds) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {restRemaining !== null && restRemaining > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginTop: 12, textAlign: 'center' }}
        >
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 4px 0' }}>DESCANSO ENTRE RONDAS</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Clock size={16} color={C.accent} />
            <span style={{ fontSize: 24, fontFamily: "'DM Mono'", fontWeight: 'bold', color: C.text }}>
              {Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
