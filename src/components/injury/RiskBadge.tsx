// src/components/injury/RiskBadge.tsx

import { AlertTriangle, Shield, ShieldAlert, ShieldX } from 'lucide-react';
import type React from 'react';

interface RiskBadgeProps {
  level: 'low' | 'moderate' | 'high' | 'critical';
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG = {
  low: {
    label: 'BAIXO',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: Shield,
  },
  moderate: {
    label: 'MODERADO',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: AlertTriangle,
  },
  high: {
    label: 'ELEVADO',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: ShieldAlert,
  },
  critical: {
    label: 'CRÍTICO',
    color: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
    icon: ShieldX,
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2',
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  size = 'md',
}) => {
  const config = CONFIG[level];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${config.color} ${SIZE_CLASSES[size]}`}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      <span>{config.label}</span>
      {score !== undefined && <span className="opacity-75">({Math.round(score)})</span>}
    </span>
  );
};
