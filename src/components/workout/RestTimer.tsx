import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRobustTimer } from '../../hooks/useRobustTimer';
import { useProgressiveHaptics } from '../../hooks/useProgressiveHaptics';
import { useBluetoothHRM } from '../../hooks/useBluetoothHRM';
import { C } from '../../data/constants';
import { useAudioCoach } from '../../hooks/useAudioCoach';

// Em atletas de Elite, a recuperação entre séries deve ser avaliada pelo ritmo cardíaco
const RECOVERY_THRESHOLD_BPM = 120;

/**
 * Beep player with AudioContext resume support for browser autoplay policy.
 * Requires user interaction first (click) to initialize audio context.
 */
function createBeepPlayer() {
  let audioCtx: AudioContext | null = null;

  const getContext = () => {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  };

  const playBeep = (frequency = 880, duration = 0.15) => {
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  };

  return { playBeep };
}

export function RestTimer({ onClose }: { onClose: () => void }) {
  const [preset, setPreset] = useState(90);
  const [sec, setSec] = useState(90);
  const [on, setOn] = useState(true);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  
  const fired = useRef(false);
  const maxWaitRef = useRef(0);
  const beepPlayer = useRef(createBeepPlayer());
  
  const { triggerRestTimerHaptic, playAlertBeep } = useProgressiveHaptics();
  
  // FASE 2: Integração de Hardware HRR (Heart Rate Recovery)
  const { bpm, status, connect } = useBluetoothHRM();
  const { speak } = useAudioCoach();

  const R = 68, circ = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(1, (preset - sec) / preset));
  
  // A série fica "Feita" se o relógio acabar OU se o coração já estiver recuperado (HRR)
  const isHeartRecovered = bpm > 0 && bpm <= RECOVERY_THRESHOLD_BPM;
  const isDone = sec <= 0 || isHeartRecovered;
  const crit = sec > 0 && sec <= 5;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Resume AudioContext on user interaction (click)
  const handleUserInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
    }
  }, [userInteracted]);

  const playBeepSound = useCallback(() => {
    if (userInteracted) {
      beepPlayer.current.playBeep(880, 0.15);
      playAlertBeep(880, 0.1, 2);
    } else {
      // Fallback vibrate if AudioContext not yet allowed
      navigator.vibrate?.(100);
    }
  }, [userInteracted, playAlertBeep]);

  const handleComplete = useCallback(() => {
     if (!fired.current) {
        fired.current = true;
        setSec(0);
        triggerRestTimerHaptic(0);
        playBeepSound();
        speak("Descanso terminado. Prepara a próxima série.");
     }
  }, [triggerRestTimerHaptic, speak, playBeepSound]);

  const handleTick = useCallback((s: number) => {
     maxWaitRef.current += 1;
     setSec(prev => {
         if (prev !== s) {
             if (s > 0 && s <= 5) {
               triggerRestTimerHaptic(s);
               if (s === 1) playBeepSound();
             }
             
             // SNC Protect: Se o descanso passou os 2 minutos e o coração não desce
             if (maxWaitRef.current >= 120 && bpm > RECOVERY_THRESHOLD_BPM) {
                 setSuggestion("Fadiga central elevada! Reduz a carga em 10% na próxima série.");
             }
             
             return s;
         }
         return prev;
     });
  }, [triggerRestTimerHaptic, bpm, playBeepSound]);

  const { start } = useRobustTimer(preset, handleTick, handleComplete);

  useEffect(() => {
    if (on && sec > 0) {
       start();
    }
  }, [preset, on, start, sec]);

  // Se o coração recuperou, disparamos o feedback tátil e alertamos o atleta
  useEffect(() => {
      if (isHeartRecovered && !fired.current) {
          fired.current = true;
          triggerRestTimerHaptic(0);
          speak("Ritmo cardíaco recuperado. Série autorizada.");
      }
  }, [isHeartRecovered, triggerRestTimerHaptic, speak]);

  useEffect(() => {
      if (suggestion) {
          speak(suggestion, true);
      }
  }, [suggestion, speak]);

  const pick = (p: number) => { setPreset(p); setSec(p); setOn(true); fired.current = false; maxWaitRef.current = 0; setSuggestion(null); };

  return (
    <div onClick={handleUserInteraction} style={{ position: "fixed", inset: 0, background: "rgba(8,11,15,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 300, marginBottom: 20 }}>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 5, color: C.muted, margin: 0 }}>DESCANSO</p>
          
          <button onClick={connect} style={{ background: 'none', border: `1px solid ${status === 'CONNECTED' ? C.green : C.muted}`, borderRadius: 12, padding: '2px 8px', color: status === 'CONNECTED' ? C.green : C.muted, fontSize: 10, cursor: 'pointer' }}>
              {status === 'CONNECTED' ? `❤️ ${bpm} BPM` : '🔗 CONETAR HRM'}
          </button>
      </div>

      <svg width={186} height={186}>
        <circle cx={93} cy={93} r={R} fill="none" stroke={C.dim} strokeWidth={7} />
        <circle cx={93} cy={93} r={R} fill="none" stroke={isDone ? C.green : crit ? C.red : C.accent} strokeWidth={7} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} transform="rotate(-90 93 93)" style={{ transition: isDone ? "none" : "stroke-dashoffset 1s linear, stroke 0.3s" }} />
        <text x={93} y={87} textAnchor="middle" fill={isDone ? C.green : crit ? C.red : C.text} fontSize={isDone ? 26 : 40} fontFamily="Bebas Neue" letterSpacing={2}>
            {isDone ? "GO!" : fmt(sec)}
        </text>
        <text x={93} y={108} textAnchor="middle" fill={C.muted} fontSize={10} fontFamily="DM Mono">
            {isDone ? "Coração Recuperado" : `${preset}s`}
        </text>
      </svg>

      {suggestion && (
          <div style={{ background: `${C.red}22`, border: `1px solid ${C.red}`, borderRadius: 8, padding: 12, marginTop: 16, maxWidth: 280, textAlign: 'center' }}>
              <span style={{ fontSize: 16, display: 'block' }}>⚠️</span>
              <span style={{ fontSize: 11, color: C.text, fontWeight: 'bold' }}>{suggestion}</span>
          </div>
      )}

      {!userInteracted && (
        <div style={{
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 8,
          padding: '8px 12px',
          marginTop: 12,
          maxWidth: 280,
          textAlign: 'center',
          fontSize: 10,
          color: '#f97316',
        }}>
          🎵 Clique para ativar som do cronómetro
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        {[30, 60, 90, 120, 180].map(p => (
          <button key={p} onClick={() => pick(p)} style={{ background: preset === p ? C.accentLow : C.card, border: `1px solid ${preset === p ? C.accent : C.border}`, borderRadius: 6, padding: "6px 11px", color: preset === p ? C.accent : C.muted, fontSize: 11, fontFamily: "'DM Mono'", cursor: "pointer" }}>{p}s</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => setOn(a => !a)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 18px", color: C.text, cursor: "pointer", fontFamily: "'Barlow'", fontWeight: 600, fontSize: 13 }}>{on ? "⏸ Pausar" : "▶ Continuar"}</button>
        <button onClick={onClose} style={{ background: C.accent, border: "none", borderRadius: 8, padding: "10px 18px", color: "#000", cursor: "pointer", fontFamily: "'Barlow'", fontWeight: 700, fontSize: 13 }}>✓ Fechar</button>
      </div>
    </div>
  );
}
