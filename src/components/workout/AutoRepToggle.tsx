import { Radio } from 'lucide-react';
// @ts-nocheck
import type React from 'react';
import { useEffect, useState } from 'react';
import { useMotionCounter } from '../../hooks/useMotionCounter';

interface AutoRepToggleProps {
  onRepDetected: () => void;
  isActive: boolean;
  onToggle: (state: boolean) => void;
}

export const AutoRepToggle: React.FC<AutoRepToggleProps> = ({
  onRepDetected,
  isActive,
  onToggle,
}) => {
  const [pulse, setPulse] = useState(false);

  const { start, stop } = useMotionCounter({
    sensitivity: 12,
    debounceMs: 1500,
    onRep: () => {
      setPulse(true);
      onRepDetected();
      setTimeout(() => setPulse(false), 500);
    },
  });

  useEffect(() => {
    if (isActive) {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [isActive, start, stop]);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        isActive
          ? 'bg-cyan-900/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          : 'bg-gray-800/60 border-gray-700 hover:bg-gray-700'
      }`}
      onClick={() => onToggle(!isActive)}
    >
      <div
        className={`relative flex items-center justify-center w-10 h-10 rounded-full ${isActive ? 'bg-cyan-500' : 'bg-gray-600'}`}
      >
        <Radio className={`w-5 h-5 text-white ${isActive ? 'animate-pulse' : ''}`} />
        {pulse && (
          <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-75"></div>
        )}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">Neural Kinetic Mode</h4>
        <p className="text-xs text-gray-400">
          {isActive ? 'Tracking motion...' : 'Auto-count reps'}
        </p>
      </div>

      <div className="ml-auto">
        <div
          className={`w-10 h-5 rounded-full p-1 flex items-center transition-colors ${isActive ? 'bg-cyan-500' : 'bg-gray-600'}`}
        >
          <div
            className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </div>
      </div>
    </div>
  );
};
