import { useEffect, useState } from 'react';
import { C } from '../../data/constants';
import { useSocialStore } from '../../stores/useSocialStore';
import { AuthModal } from './AuthModal';
import { ClubTab } from './ClubTab';
import { DuelsTab } from './DuelsTab';
import { LeaderboardTab } from './LeaderboardTab';

type Tab = 'clube' | 'leaderboard' | 'duelos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'leaderboard', label: '🏆 Ranking' },
  { id: 'duelos', label: '⚔️ Duelos' },
  { id: 'clube', label: '🔥 Clube' },
];

export const SocialModal = ({ onClose }: { onClose: () => void }) => {
  const { profile, isConfigured, loadSession, signOut } = useSocialStore();
  const [tab, setTab] = useState<Tab>('leaderboard');

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,11,15,0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#1a1f25',
          borderRadius: 16,
          padding: '20px',
          width: '90%',
          maxWidth: 420,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${C.accent}44`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: C.accent, margin: 0 }}>
            REDE SOCIAL
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.muted,
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {!isConfigured ? (
          <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 20 }}>
            A rede social ainda não está configurada neste ambiente (faltam VITE_SUPABASE_URL /
            VITE_SUPABASE_ANON_KEY).
          </p>
        ) : !profile ? (
          <AuthModal />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>@{profile.username}</p>
              <button
                onClick={signOut}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.muted,
                  fontSize: 11,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Terminar sessão
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 4,
                marginBottom: 16,
                background: '#080b0f',
                borderRadius: 8,
                padding: 4,
              }}
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    background: tab === t.id ? C.accent : 'transparent',
                    color: tab === t.id ? C.bg : C.muted,
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'leaderboard' && <LeaderboardTab />}
            {tab === 'duelos' && <DuelsTab />}
            {tab === 'clube' && <ClubTab />}
          </>
        )}
      </div>
    </div>
  );
};
