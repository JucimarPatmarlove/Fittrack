// @ts-nocheck
// src/components/workout/MobilityTimer.tsx
// Temporizador de "tempo sob tensão" para o modo Mobilidade
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  exerciseName: string;
  defaultSeconds?: number;
}

export function MobilityTimer({ exerciseName, defaultSeconds = 30 }: Props) {
  const [targetSeconds, setTargetSeconds] = useState(defaultSeconds);
  const [timeLeft, setTimeLeft] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setCompleted(true);
          navigator.vibrate?.([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const reset = () => {
    setIsRunning(false);
    setCompleted(false);
    setTimeLeft(targetSeconds);
  };

  const progress = 1 - timeLeft / targetSeconds;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      style={{
        background: 'rgba(167, 139, 250, 0.08)',
        border: '1px solid rgba(167, 139, 250, 0.25)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              color: '#a78bfa',
              fontFamily: "'DM Mono', monospace",
              letterSpacing: 2,
            }}
          >
            🧘 TEMPO SOB TENSÃO
          </p>
          <p style={{ fontSize: 14, color: '#eceae4', fontWeight: 600 }}>
            {exerciseName}
          </p>
        </div>

        {/* Duração em segundos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => {
              const next = Math.max(10, targetSeconds - 10);
              setTargetSeconds(next);
              if (!isRunning) setTimeLeft(next);
            }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 6,
              width: 26,
              height: 26,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            −
          </button>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
              color: '#a78bfa',
              minWidth: 36,
              textAlign: 'center',
            }}
          >
            {targetSeconds}s
          </span>
          <button
            onClick={() => {
              const next = targetSeconds + 10;
              setTargetSeconds(next);
              if (!isRunning) setTimeLeft(next);
            }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 6,
              width: 26,
              height: 26,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Círculo de progresso */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="wait">
              {completed ? (
                <motion.span
                  key="done"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ fontSize: 28 }}
                >
                  ✅
                </motion.span>
              ) : (
                <motion.span
                  key="time"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 24,
                    fontWeight: 700,
                    color: completed ? '#3dd68c' : '#a78bfa',
                  }}
                >
                  {timeLeft}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Botões de controlo */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setIsRunning((r) => !r)}
          disabled={completed}
          style={{
            flex: 2,
            background: isRunning
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(167, 139, 250, 0.25)',
            border: `1px solid ${isRunning ? '#ef4444' : '#a78bfa'}`,
            borderRadius: 10,
            padding: 12,
            color: isRunning ? '#fca5a5' : '#a78bfa',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 16,
            letterSpacing: 1.5,
            cursor: 'pointer',
          }}
        >
          {isRunning ? '⏸ PAUSAR' : completed ? '✓ COMPLETO' : '▶ INICIAR'}
        </button>
        <button
          onClick={reset}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: 12,
            color: '#55626e',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 16,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          ↺ RESET
        </button>
      </div>
    </div>
  );
}
