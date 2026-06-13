// src/components/ui/EmptyState.tsx
// Componente reutilizável de "Estado Vazio" com design premium.
// Exibe ícone, mensagem e CTA quando não há dados disponíveis.

import React from 'react';
import { C } from '../../data/constants';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      minHeight: 300,
    }}
  >
    <div
      style={{
        fontSize: 64,
        marginBottom: 20,
        filter: 'drop-shadow(0 0 20px rgba(232,200,74,0.3))',
        animation: 'pulse 2s ease-in-out infinite',
      }}
    >
      {icon}
    </div>
    <h2
      style={{
        fontFamily: "'Bebas Neue', cursive",
        fontSize: 28,
        color: C.accent,
        letterSpacing: 2,
        marginBottom: 8,
      }}
    >
      {title}
    </h2>
    <p
      style={{
        color: 'rgba(236, 234, 228, 0.6)',
        fontSize: 14,
        maxWidth: 320,
        lineHeight: 1.6,
        marginBottom: 24,
      }}
    >
      {description}
    </p>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: `linear-gradient(135deg, ${C.accent}, #d4a017)`,
            color: '#000',
            border: 'none',
            borderRadius: 12,
            padding: '14px 28px',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 16,
            letterSpacing: 1.5,
            cursor: 'pointer',
            boxShadow: `0 4px 20px rgba(232,200,74,0.3)`,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          {actionLabel}
        </button>
      )}
      {secondaryLabel && onSecondary && (
        <button
          onClick={onSecondary}
          style={{
            background: 'transparent',
            color: 'rgba(236,234,228,0.5)',
            border: '1px solid rgba(236,234,228,0.15)',
            borderRadius: 12,
            padding: '14px 28px',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 16,
            letterSpacing: 1.5,
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
    <style>{`
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `}</style>
  </div>
);
