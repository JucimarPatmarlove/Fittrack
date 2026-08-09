// src/components/recovery/HRVInput.tsx

import { Heart } from 'lucide-react';
import type React from 'react';

interface HRVInputProps {
  hrv?: number;
  restingHR?: number;
  onHRVChange: (val?: number) => void;
  onRestingHRChange: (val?: number) => void;
}

export const HRVInput: React.FC<HRVInputProps> = ({
  hrv,
  restingHR,
  onHRVChange,
  onRestingHRChange,
}) => {
  return (
    <div className="bg-[#131920] border border-[rgba(232,200,74,0.15)] rounded-2xl p-5 mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#1a222c] rounded-lg">
          <Heart className="w-5 h-5 text-[#e8c84a]" />
        </div>
        <h3 className="font-['Bebas_Neue'] text-xl tracking-wide text-white m-0">
          MÉTRICAS CARDÍACAS{' '}
          <span className="text-xs text-gray-500 font-sans tracking-normal">(Opcional)</span>
        </h3>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
            HRV (ms)
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="Ex: 55"
              value={hrv || ''}
              onChange={(e) => {
                const val = Number.parseInt(e.target.value);
                onHRVChange(isNaN(val) ? undefined : val);
              }}
              className="w-full bg-[#0f141a] border border-gray-800 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c84a] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
            Resting HR (bpm)
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="Ex: 50"
              value={restingHR || ''}
              onChange={(e) => {
                const val = Number.parseInt(e.target.value);
                onRestingHRChange(isNaN(val) ? undefined : val);
              }}
              className="w-full bg-[#0f141a] border border-gray-800 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c84a] transition-colors"
            />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 mt-3 font-mono">
        {'>'} Deixa em branco se não tiveres um smartwatch/anel.
      </p>
    </div>
  );
};
