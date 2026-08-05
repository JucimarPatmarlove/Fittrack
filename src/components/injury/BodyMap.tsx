// src/components/injury/BodyMap.tsx

import React from 'react';
import { StressReading, BodyRegion } from '../../types/injury';

interface BodyMapProps {
  flaggedRegions: StressReading[];
  onRegionClick?: (region: BodyRegion) => void;
  compact?: boolean;
}

// Coordenadas aproximadas para cada região num SVG de corpo humano
const REGION_COORDS: Record<BodyRegion, { x: number; y: number; side: 'left' | 'right' | 'center' }> = {
  ombro_esquerdo: { x: 35, y: 22, side: 'left' },
  ombro_direito: { x: 65, y: 22, side: 'right' },
  cotovelo_esquerdo: { x: 30, y: 35, side: 'left' },
  cotovelo_direito: { x: 70, y: 35, side: 'right' },
  punho_esquerdo: { x: 28, y: 45, side: 'left' },
  punho_direito: { x: 72, y: 45, side: 'right' },
  coluna_cervical: { x: 50, y: 15, side: 'center' },
  coluna_toracica: { x: 50, y: 28, side: 'center' },
  coluna_lombar: { x: 50, y: 42, side: 'center' },
  anca_esquerda: { x: 42, y: 50, side: 'left' },
  anca_direita: { x: 58, y: 50, side: 'right' },
  joelho_esquerdo: { x: 40, y: 65, side: 'left' },
  joelho_direito: { x: 60, y: 65, side: 'right' },
  tornozelo_esquerdo: { x: 38, y: 82, side: 'left' },
  tornozelo_direito: { x: 62, y: 82, side: 'right' },
};

const RISK_COLORS = {
  low: '#22c55e',      // green-500
  moderate: '#eab308', // yellow-500
  high: '#f97316',     // orange-500
  critical: '#dc2626', // red-600
};

const RISK_PULSE = {
  low: false,
  moderate: false,
  high: true,
  critical: true,
};

export const BodyMap: React.FC<BodyMapProps> = ({ flaggedRegions, onRegionClick, compact = false }) => {
  const getRegionStatus = (region: BodyRegion): StressReading | undefined => {
    return flaggedRegions.find(r => r.region === region);
  };

  return (
    <div className={`relative ${compact ? 'w-[100px] h-[140px]' : 'w-[200px] h-[280px]'}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Silhueta do corpo - versão simplificada cibernética */}
        <ellipse cx="50" cy="8" rx="8" ry="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" /> {/* Cabeça */}
        <rect x="40" y="18" width="20" height="30" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" /> {/* Tronco */}
        <rect x="28" y="20" width="8" height="30" rx="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" /> {/* Braço E */}
        <rect x="64" y="20" width="8" height="30" rx="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" /> {/* Braço D */}
        <rect x="40" y="50" width="9" height="35" rx="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" /> {/* Perna E */}
        <rect x="51" y="50" width="9" height="35" rx="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" /> {/* Perna D */}
        
        {/* Pontos de risco */}
        {Object.entries(REGION_COORDS).map(([region, coords]) => {
          const status = getRegionStatus(region as BodyRegion);
          if (!status) return null;
          
          const color = RISK_COLORS[status.riskLevel];
          const shouldPulse = RISK_PULSE[status.riskLevel];
          const radius = compact ? 3 : 5;
          
          return (
            <g key={region}>
              <circle
                cx={coords.x}
                cy={coords.y}
                r={radius}
                fill={color}
                className={shouldPulse ? 'animate-pulse' : ''}
                style={{ cursor: onRegionClick ? 'pointer' : 'default', opacity: 0.9 }}
                onClick={() => onRegionClick?.(region as BodyRegion)}
              />
              {/* Tooltip simples */}
              {!compact && (
                <text
                  x={coords.x}
                  y={coords.y - radius - 2}
                  textAnchor="middle"
                  fontSize="3"
                  fill={color}
                  fontWeight="bold"
                >
                  {status.acuteChronicRatio.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Legenda compacta */}
      {compact && flaggedRegions.length > 0 && (
        <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-1">
          {flaggedRegions.slice(0, 3).map((r, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: RISK_COLORS[r.riskLevel] }}
            />
          ))}
          {flaggedRegions.length > 3 && (
            <span className="text-[8px] text-gray-500">+{flaggedRegions.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};
