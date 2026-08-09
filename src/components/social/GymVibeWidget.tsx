// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../../data/constants';
import { useVibeStore } from '../../stores/useVibeStore';

export function GymVibeWidget({ onOpenVibe }: { onOpenVibe: () => void }) {
  const { getRecentVibes } = useVibeStore();
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const recent = getRecentVibes(0.5); // last 30 minutes
      setActiveCount(recent.length);
    };

    updateCount();
    const interval = setInterval(updateCount, 60000);
    return () => clearInterval(interval);
  }, [getRecentVibes]);

  return (
    <AnimatePresence>
      {activeCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={onOpenVibe}
          style={{ background: `${C.accent}22`, border: `1px solid ${C.accent}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ fontSize: 20 }}
            >
              🎵
            </motion.span>
            <div>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: C.accent }}>{activeCount} pessoa{activeCount !== 1 ? 's' : ''} a treinar agora</span>
              <span style={{ display: 'block', fontSize: 11, color: '#fff' }}>Ouve a música do ginásio!</span>
            </div>
          </div>
          <span style={{ fontSize: 12, color: C.accent, fontWeight: 'bold' }}>VER &gt;</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
