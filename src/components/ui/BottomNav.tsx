// src/components/ui/BottomNav.tsx
// Barra de navegação inferior extraída do App.tsx para componente reutilizável.

import type React from 'react';
import { useState } from 'react';
import { C } from '../../data/constants';
import type { ViewName } from '../../hooks/useFitnessData';

interface BottomNavProps {
  view: ViewName;
  setView: (v: ViewName) => void;
  historyCount: number;
  onOpenClub: () => void;
}

interface NavItem {
  id: ViewName;
  icon: string;
  label: string;
  requiresHistory?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '🏋️', label: 'Treino' },
  { id: 'trends', icon: '📈', label: 'Tendências' },
  { id: 'recovery', icon: '⚕️', label: 'Recovery' },
  { id: 'planner', icon: '🗓️', label: 'Planner' },
  { id: 'gymvibe', icon: '🎵', label: 'Vibe' },
];

const HIDDEN_VIEWS = new Set<ViewName>(['workout', 'assessment', 'guide', 'feedback', 'rewards']);

export const BottomNav: React.FC<BottomNavProps> = ({
  view,
  setView,
  historyCount,
  onOpenClub,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (HIDDEN_VIEWS.has(view)) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
        pointerEvents: 'none',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {toastMessage && (
        <div
          style={{
            background: 'rgba(232, 74, 74, 0.9)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 20,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
            animation: 'fadeInOut 3s ease-in-out',
          }}
        >
          {toastMessage}
        </div>
      )}
      <div
        className="glass"
        style={{
          display: 'flex',
          gap: '20px',
          padding: '12px 24px',
          borderRadius: '32px',
          pointerEvents: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={view === item.id}
            onClick={() => setView(item.id)}
          />
        ))}

        {/* Club button — locked until 3 workouts */}
        {historyCount >= 3 ? (
          <NavButton icon="👥" label="Clube" isActive={false} onClick={onOpenClub} />
        ) : (
          <NavButton
            icon="👥"
            label=""
            isActive={false}
            disabled
            onClick={() =>
              showToast(
                '🔒 Os Clubes Sociais desbloqueiam ao completares o 3º Treino! Continua assim!',
              )
            }
          />
        )}

        <NavButton
          icon="💎"
          label="Loja"
          isActive={view === 'rewards'}
          onClick={() => setView('rewards')}
        />
        <NavButton
          icon="👤"
          label="Perfil"
          isActive={view === 'settings'}
          onClick={() => setView('settings')}
        />
      </div>
    </div>
  );
};

// ── Sub-componente do botão de navegação ──
const NavButton: React.FC<{
  icon: string;
  label: string;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, disabled, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      color: isActive ? C.accent : C.muted,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
    }}
  >
    <span style={{ fontSize: 20 }}>{icon}</span>
    {isActive && label && <span style={{ fontSize: 10, fontWeight: 'bold' }}>{label}</span>}
  </button>
);
