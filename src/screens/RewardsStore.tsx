import { Coins, Lock, Sparkles, Zap } from 'lucide-react';
import type React from 'react';
import { GlobalBackground } from '../components/ui/GlobalBackground';
import { useEffortStore } from '../stores/useEffortStore';

export const RewardsStore: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { fitTokens, totalEffortPoints } = useEffortStore();

  const rewards = [
    {
      id: 'theme_neon',
      name: 'Neon Pink Theme',
      cost: 10,
      type: 'theme',
      icon: <Sparkles className="w-6 h-6 text-pink-500" />,
    },
    {
      id: 'theme_cyber',
      name: 'Cyberpunk Blue',
      cost: 25,
      type: 'theme',
      icon: <Zap className="w-6 h-6 text-cyan-500" />,
    },
    {
      id: 'badge_elite',
      name: 'Elite Athlete Badge',
      cost: 50,
      type: 'badge',
      icon: <Lock className="w-6 h-6 text-yellow-500" />,
    },
  ];

  return (
    <GlobalBackground>
      <div
        style={{
          minHeight: '100vh',
          padding: '24px',
          paddingBottom: '96px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              color: 'rgba(255,255,255,0.5)',
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '24px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ← Voltar
          </button>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              fontFamily: '"Bebas Neue", sans-serif',
              letterSpacing: '2px',
              color: '#fff',
              margin: 0,
            }}
          >
            LOJA $FIT
          </h2>
          <div style={{ width: '40px' }}></div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px 0' }}
            >
              Saldo Atual
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={32} color="#00ff88" />
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>
                {fitTokens} <span style={{ fontSize: '1.25rem', color: '#00ff88' }}>$FIT</span>
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px 0' }}>
              Pontos de Esforço
            </p>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#00d4ff',
                margin: '0 0 4px 0',
              }}
            >
              {totalEffortPoints} / 1000
            </p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              para o próximo token
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3
            style={{
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '16px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            RECOMPENSAS DISPONÍVEIS
          </h3>

          {rewards.map((reward) => {
            const canAfford = fitTokens >= reward.cost;
            return (
              <div
                key={reward.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${canAfford ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: canAfford ? 1 : 0.6,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {reward.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      margin: '0 0 4px 0',
                      fontSize: '1rem',
                    }}
                  >
                    {reward.name}
                  </h4>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    {reward.type}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: canAfford ? '#00ff88' : 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      justifyContent: 'flex-end',
                      fontSize: '1rem',
                    }}
                  >
                    {reward.cost} <Coins size={14} />
                  </span>
                  <button
                    disabled={!canAfford}
                    style={{
                      marginTop: '8px',
                      fontSize: '0.75rem',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontWeight: 'bold',
                      border: 'none',
                      background: canAfford ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                      color: canAfford ? '#00ff88' : 'rgba(255,255,255,0.3)',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {canAfford ? 'COMPRAR' : 'BLOQUEADO'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlobalBackground>
  );
};
