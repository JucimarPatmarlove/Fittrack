// src/components/recovery/MoodTracker.tsx

import React from 'react';
import { Brain } from 'lucide-react';

interface MoodTrackerProps {
  mood: number;
  stressLevel: number;
  onMoodChange: (m: number) => void;
  onStressChange: (s: number) => void;
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({
  mood,
  stressLevel,
  onMoodChange,
  onStressChange,
}) => {
  return (
    <div className="bg-[#131920] border border-[rgba(232,200,74,0.15)] rounded-2xl p-5 mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#1a222c] rounded-lg">
          <Brain className="w-5 h-5 text-[#e8c84a]" />
        </div>
        <h3 className="font-['Bebas_Neue'] text-xl tracking-wide text-white m-0">
          ESTADO NEUROLÓGICO
        </h3>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
            Motivação / Energia
          </label>
          <span className="text-sm font-bold text-[#e8c84a]">{mood}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={mood}
          onChange={(e) => onMoodChange(parseInt(e.target.value))}
          className="w-full accent-[#e8c84a] h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-2 font-mono">
          <span>Exausto (1)</span>
          <span>Pronto para a Guerra (10)</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
            Stress Mental
          </label>
          <span className="text-sm font-bold text-[#e8c84a]">{stressLevel}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={stressLevel}
          onChange={(e) => onStressChange(parseInt(e.target.value))}
          className="w-full accent-red-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-2 font-mono">
          <span>Zen (1)</span>
          <span>Sobrecarga (10)</span>
        </div>
      </div>
    </div>
  );
};
