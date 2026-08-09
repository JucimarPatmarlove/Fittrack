import { AnimatePresence, motion } from 'framer-motion';
// @ts-nocheck
import { useEffect } from 'react';
import { C } from '../../data/constants';

interface PRTrackerProps {
  exerciseName: string;
  weight: number;
  onClose: () => void;
}

export function PRTracker({ exerciseName, weight, onClose }: PRTrackerProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: [1, 1.1, 1], y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        style={{
          position: 'fixed',
          bottom: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${C.accent}, #e8a44a)`,
          color: '#000',
          padding: '12px 24px',
          borderRadius: 30,
          boxShadow: '0 10px 25px rgba(232, 200, 74, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 24 }}>🏆</span>
        <div>
          <span
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 'bold',
              fontFamily: "'Bebas Neue'",
              letterSpacing: 1,
            }}
          >
            NOVO RECORD PESSOAL!
          </span>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>
            {exerciseName} • {weight} kg (1RM)
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
