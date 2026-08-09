// @ts-nocheck
import React from 'react';
import { TrendStatus } from '../../services/trendAnalyzer';

export const TrendStatusBadge = ({ status, compact = false }: { status: TrendStatus, compact?: boolean }) => {
  let color = '#55626e';
  let label = 'SEM DADOS';
  let icon = '➖';

  if (status === 'PROGRESSING') {
    color = '#ccff00';
    label = 'PROGRESSO';
    icon = '🔥';
  } else if (status === 'FATIGUED') {
    color = '#ff6b35';
    label = 'FADIGADO';
    icon = '⚠️';
  } else if (status === 'STABLE') {
    color = '#4ade80';
    label = 'ESTÁVEL';
    icon = '✅';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: compact ? '2px 8px' : '4px 12px',
      background: `${color}15`,
      border: `1px solid ${color}44`,
      borderRadius: 12,
      color: color,
      fontSize: compact ? 10 : 12,
      fontFamily: 'monospace',
      fontWeight: 'bold',
    }}>
      <span>{icon}</span>
      {!compact && <span>{label}</span>}
    </div>
  );
};
