// src/components/recovery/SorenessMap.tsx

import React from 'react';
import { Activity } from 'lucide-react';
import { BodyRegion } from '../../types/injury';

interface SorenessMapProps {
  soreness: Record<string, number>;
  onRegionClick: (region: string) => void;
  onClearRegion: (region: string) => void;
}

// Reutilizamos as mesmas coordenadas do BodyMap para consistência
const REGION_COORDS: Record<BodyRegion, { x: number; y: number; label: string }> = {
  ombro_esquerdo: { x: 35, y: 22, label: 'Ombro E.' },
  ombro_direito: { x: 65, y: 22, label: 'Ombro D.' },
  cotovelo_esquerdo: { x: 30, y: 35, label: 'Cotovelo E.' },
  cotovelo_direito: { x: 70, y: 35, label: 'Cotovelo D.' },
  punho_esquerdo: { x: 28, y: 45, label: 'Punho E.' },
  punho_direito: { x: 72, y: 45, label: 'Punho D.' },
  coluna_cervical: { x: 50, y: 15, label: 'Cervical' },
  coluna_toracica: { x: 50, y: 28, label: 'Torácica' },
  coluna_lombar: { x: 50, y: 42, label: 'Lombar' },
  anca_esquerda: { x: 42, y: 50, label: 'Anca E.' },
  anca_direita: { x: 58, y: 50, label: 'Anca D.' },
  joelho_esquerdo: { x: 40, y: 65, label: 'Joelho E.' },
  joelho_direito: { x: 60, y: 65, label: 'Joelho D.' },
  tornozelo_esquerdo: { x: 38, y: 82, label: 'Tornozelo E.' },
  tornozelo_direito: { x: 62, y: 82, label: 'Tornozelo D.' },
};

export const SorenessMap: React.FC<SorenessMapProps> = ({
  soreness,
  onRegionClick,
  onClearRegion,
}) => {
  const getPainColor = (level: number) => {
    if (level === 0) return 'rgba(255,255,255,0.1)';
    if (level <= 3) return '#eab308'; // amarelo
    if (level <= 6) return '#f97316'; // laranja
    return '#dc2626'; // vermelho
  };

  const getPainRadius = (level: number) => {
    if (level === 0) return 4;
    return 4 + (level / 2); // Cresce conforme a dor
  };

  return (
    <div className="bg-[#131920] border border-[rgba(232,200,74,0.15)] rounded-2xl p-5 mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1a222c] rounded-lg">
            <Activity className="w-5 h-5 text-[#e8c84a]" />
          </div>
          <div>
            <h3 className="font-['Bebas_Neue'] text-xl tracking-wide text-white m-0">
              MAPA DE DORES
            </h3>
            <p className="text-xs text-gray-500 uppercase">Toca nas zonas doridas (0-10)</p>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-[280px] h-[350px] mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          {/* Silhueta Cibernética Dark */}
          <ellipse cx="50" cy="8" rx="8" ry="10" fill="#1a222c" stroke="#2d3748" strokeWidth="0.5" />
          <rect x="40" y="18" width="20" height="30" rx="4" fill="#1a222c" stroke="#2d3748" strokeWidth="0.5" />
          <rect x="28" y="20" width="8" height="30" rx="3" fill="#1a222c" stroke="#2d3748" strokeWidth="0.5" />
          <rect x="64" y="20" width="8" height="30" rx="3" fill="#1a222c" stroke="#2d3748" strokeWidth="0.5" />
          <rect x="40" y="50" width="9" height="35" rx="3" fill="#1a222c" stroke="#2d3748" strokeWidth="0.5" />
          <rect x="51" y="50" width="9" height="35" rx="3" fill="#1a222c" stroke="#2d3748" strokeWidth="0.5" />

          {/* Pontos de Dor Interativos */}
          {Object.entries(REGION_COORDS).map(([region, coords]) => {
            const level = soreness[region] || 0;
            const color = getPainColor(level);
            const radius = getPainRadius(level);

            return (
              <g key={region} onClick={() => onRegionClick(region)} className="cursor-pointer">
                {/* Zona de Hitbox invisível para facilitar o toque no telemóvel */}
                <circle cx={coords.x} cy={coords.y} r="8" fill="transparent" />
                
                {/* Indicador Visual */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={radius}
                  fill={color}
                  opacity={level === 0 ? 0.3 : 0.9}
                  className={level >= 7 ? 'animate-pulse' : 'transition-all duration-300'}
                  style={{ filter: level > 0 ? `drop-shadow(0 0 4px ${color})` : 'none' }}
                />
                
                {/* Label de número se tiver dor */}
                {level > 0 && (
                  <text
                    x={coords.x}
                    y={coords.y + 1}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize="3.5"
                    fontWeight="bold"
                    fill="#fff"
                    style={{ pointerEvents: 'none' }}
                  >
                    {level}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {Object.keys(soreness).length > 0 && (
        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
          <p className="text-xs text-gray-400 font-semibold mb-2 uppercase">Zonas Afetadas:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(soreness).map(([region, level]) => (
              <div 
                key={region} 
                onClick={() => onClearRegion(region)}
                className="flex items-center gap-2 bg-[#0f141a] px-3 py-1.5 rounded-full border border-gray-800 cursor-pointer hover:border-red-900 transition-colors"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getPainColor(level) }} />
                <span className="text-xs text-gray-300 capitalize">{region.replace('_', ' ')}: {level}/10</span>
                <span className="text-gray-600 ml-1">×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
