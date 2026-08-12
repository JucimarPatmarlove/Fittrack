import type React from 'react';

export function AmrapHUD({
  amrapTimeLeft,
  amrapDuration,
  roundsCompleted,
  amrapRunning,
  setAmrapRunning,
  setRoundsCompleted,
  setAmrapTimeLeft,
}: {
  amrapTimeLeft: number;
  amrapDuration: number;
  roundsCompleted: number;
  amrapRunning: boolean;
  setAmrapRunning: (v: boolean) => void;
  setRoundsCompleted: React.Dispatch<React.SetStateAction<number>>;
  setAmrapTimeLeft: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div
      style={{
        background: 'rgba(249,115,22,0.08)',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: 14,
        padding: 16,
        marginTop: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div>
          <p style={{ fontSize: 10, color: '#f97316', fontFamily: "'DM Mono'", letterSpacing: 2 }}>
            TEMPO RESTANTE
          </p>
          <p
            style={{
              fontFamily: "'DM Mono'",
              fontSize: 32,
              color: amrapTimeLeft < 60 ? '#ef4444' : '#f97316',
              fontWeight: 700,
            }}
          >
            {Math.floor(amrapTimeLeft / 60)}:{(amrapTimeLeft % 60).toString().padStart(2, '0')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: '#55626e', fontFamily: "'DM Mono'", letterSpacing: 2 }}>
            RONDAS
          </p>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: '#f97316' }}>
            {roundsCompleted}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setAmrapRunning(!amrapRunning)}
          disabled={amrapTimeLeft <= 0}
          style={{
            flex: 2,
            background: amrapRunning ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)',
            border: `1px solid ${amrapRunning ? '#ef4444' : '#f97316'}`,
            borderRadius: 10,
            padding: 20,
            color: amrapRunning ? '#fca5a5' : '#f97316',
            fontFamily: "'Bebas Neue'",
            fontSize: 16,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          {amrapRunning ? '⏸ PAUSAR' : amrapTimeLeft <= 0 ? '✓ FIM' : '▶ INICIAR'}
        </button>
        <button
          onClick={() => setRoundsCompleted((r) => r + 1)}
          style={{
            flex: 1,
            background: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 10,
            padding: 20,
            color: '#f97316',
            fontFamily: "'Bebas Neue'",
            fontSize: 14,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          + RONDA
        </button>
        <button
          onClick={() => {
            setAmrapTimeLeft(amrapDuration);
            setAmrapRunning(false);
            setRoundsCompleted(0);
          }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#55626e',
            fontFamily: "'Bebas Neue'",
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          ↺
        </button>
      </div>
    </div>
  );
}
