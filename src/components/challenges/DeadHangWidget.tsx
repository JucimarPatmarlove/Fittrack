import { motion } from 'framer-motion';
// @ts-nocheck
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { C } from '../../data/constants';

interface DeadHangWidgetProps {
  targetSeconds: number;
  onSuccess: () => void;
}

export const DeadHangWidget = ({ targetSeconds, onSuccess }: DeadHangWidgetProps) => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && !completed) {
      interval = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= targetSeconds) {
            setIsActive(false);
            setCompleted(true);
            setShowConfetti(true);
            onSuccess();
            setTimeout(() => setShowConfetti(false), 5000);
          }
          return next;
        });
      }, 1000);
    } else if (!isActive && seconds !== 0 && !completed) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, completed, targetSeconds, onSuccess]);

  const progress = Math.min((seconds / targetSeconds) * 100, 100);

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.accent}`,
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {showConfetti && (
        <Confetti
          width={300}
          height={150}
          recycle={false}
          style={{ position: 'absolute', inset: 0 }}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, color: C.text, fontWeight: 'bold' }}>
          🕒 Temporizador: Dead Hang
        </span>
        <span
          style={{ fontFamily: "'DM Mono'", fontSize: 16, color: completed ? C.green : C.accent }}
        >
          {seconds}s / {targetSeconds}s
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: 8,
          background: C.bg,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          style={{ height: '100%', background: completed ? C.green : C.accent }}
        />
      </div>

      {!completed ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setIsActive(!isActive)}
            style={{
              flex: 1,
              background: isActive ? C.red : C.accent,
              color: isActive ? '#fff' : '#000',
              border: 'none',
              borderRadius: 8,
              padding: 10,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {isActive ? 'PARAR' : seconds > 0 ? 'RETOMAR' : 'INICIAR'}
          </button>
          {seconds > 0 && !isActive && (
            <button
              onClick={() => setSeconds(0)}
              style={{
                background: C.surface,
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                cursor: 'pointer',
              }}
            >
              RESET
            </button>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: C.green, fontWeight: 'bold', fontSize: 14 }}>
          🎉 DESAFIO CONCLUÍDO! XP ATRIBUÍDO!
        </div>
      )}
    </div>
  );
};
