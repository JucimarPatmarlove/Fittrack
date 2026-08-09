// @ts-nocheck
import { useState, useEffect } from 'react';
import { Ghost } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGhostStore } from '../stores/useGhostStore';

export const GhostToggle = () => {
  const { active, toggleGhost, getDailyFailureUsed } = useGhostStore();
  const [pulse, setPulse] = useState(false);
  const canUse = !getDailyFailureUsed();
  
  useEffect(() => {
    if (active) {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
    }
  }, [active]);
  
  return (
    <motion.button
      onClick={() => canUse && toggleGhost()}
      className={`p-3 rounded-full transition-all flex items-center justify-center ${
        active 
          ? 'bg-gradient-to-r from-[#e8c84a] to-[#d4b03a] shadow-lg shadow-[#e8c84a]/30 text-[#080b0f]' 
          : 'bg-[#1a1f25] border border-[#e8c84a]/30 text-[#e8c84a]'
      } ${!canUse && 'opacity-50 cursor-not-allowed'}`}
      style={{ position: 'relative' }}
      whileTap={{ scale: 0.95 }}
      animate={pulse ? { scale: 1.05 } : { scale: 1 }}
    >
      <Ghost size={24} />
      {active && (
        <motion.div
          style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, background: '#10b981', borderRadius: '50%' }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
    </motion.button>
  );
};
