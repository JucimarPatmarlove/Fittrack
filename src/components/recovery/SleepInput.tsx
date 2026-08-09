// src/components/recovery/SleepInput.tsx

import { Moon, Star } from 'lucide-react';
import type React from 'react';

interface SleepInputProps {
  hours: number;
  quality: number;
  onHoursChange: (h: number) => void;
  onQualityChange: (q: number) => void;
}

export const SleepInput: React.FC<SleepInputProps> = ({
  hours,
  quality,
  onHoursChange,
  onQualityChange,
}) => {
  return (
    <div className="bg-[#131920] border border-[rgba(232,200,74,0.15)] rounded-2xl p-5 mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#1a222c] rounded-lg">
          <Moon className="w-5 h-5 text-[#e8c84a]" />
        </div>
        <h3 className="font-['Bebas_Neue'] text-xl tracking-wide text-white m-0">
          SONO & DESCANSO
        </h3>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
            Horas de Sono
          </label>
          <span className="text-lg font-bold text-[#e8c84a]">{hours}h</span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          step="0.5"
          value={hours}
          onChange={(e) => onHoursChange(Number.parseFloat(e.target.value))}
          className="w-full accent-[#e8c84a] h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-2 font-mono">
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 font-semibold uppercase tracking-wider mb-3">
          Qualidade Percecionada (1-10)
        </label>
        <div className="flex justify-between gap-1">
          {[2, 4, 6, 8, 10].map((level) => (
            <button
              key={level}
              onClick={() => onQualityChange(level)}
              className={`flex-1 py-2 flex justify-center items-center rounded-lg border transition-all ${
                quality >= level
                  ? 'bg-[rgba(232,200,74,0.2)] border-[#e8c84a] text-[#e8c84a]'
                  : 'bg-[#0f141a] border-gray-800 text-gray-600 hover:border-gray-600'
              }`}
            >
              <Star className="w-4 h-4" fill={quality >= level ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
