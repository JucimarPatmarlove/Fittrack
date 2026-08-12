import type React from 'react';

export function EmomHUD({
  emomRemainingSeconds,
  emomRound,
  emomRunning,
  setEmomRunning,
  setEmomRemainingSeconds,
  setEmomRound,
}: {
  emomRemainingSeconds: number;
  emomRound: number;
  emomRunning: boolean;
  setEmomRunning: (v: boolean) => void;
  setEmomRemainingSeconds: React.Dispatch<React.SetStateAction<number>>;
  setEmomRound: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div
      style={{
        background: 'rgba(56,189,248,0.08)',
        border: '1px solid rgba(56,189,248,0.3)',
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
          <p style={{ fontSize: 10, color: '#38bdf8', fontFamily: "'DM Mono'", letterSpacing: 2 }}>
            TEMPO P/ PRÓXIMA RONDA
          </p>
          <p
            style={{
              fontFamily: "'DM Mono'",
              fontSize: 40,
              color: emomRemainingSeconds <= 10 ? '#ef4444' : '#38bdf8',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {emomRemainingSeconds}
            <span style={{ fontSize: 16 }}>s</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: '#55626e', fontFamily: "'DM Mono'", letterSpacing: 2 }}>
            RONDA
          </p>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: '#38bdf8' }}>#{emomRound}</p>
        </div>
      </div>
      <div
        style={{
          width: '100%',
          height: 4,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((60 - emomRemainingSeconds) / 60) * 100}%`,
            background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
            borderRadius: 2,
            transition: 'width 1s linear',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setEmomRunning(!emomRunning)}
          style={{
            flex: 2,
            background: emomRunning ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.2)',
            border: `1px solid ${emomRunning ? '#ef4444' : '#38bdf8'}`,
            borderRadius: 10,
            padding: 20,
            color: emomRunning ? '#fca5a5' : '#38bdf8',
            fontFamily: "'Bebas Neue'",
            fontSize: 16,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          {emomRunning ? '⏸ PAUSAR' : '▶ INICIAR'}
        </button>
        <button
          onClick={() => {
            setEmomRunning(false);
            setEmomRemainingSeconds(60);
            setEmomRound(1);
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
