import { useEffect, useRef, useCallback } from 'react';

export const useRobustTimer = (durationSeconds: number, onTick: (sec: number) => void, onComplete: () => void) => {
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingRef = useRef(durationSeconds);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Inicializar AudioContext apenas quando necessário (user gesture)
  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
          await audioContextRef.current.resume();
      }
    }
  }, []);
  
  const playBeep = useCallback(async (frequency = 880, duration = 0.2) => {
    await initAudio();
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    // Resume o context se o browser tiver suspenso
    if (ctx.state === 'suspended') await ctx.resume();
    
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.3;
    
    oscillator.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  }, [initAudio]);
  
  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    startTimeRef.current = Date.now();
    remainingRef.current = durationSeconds;
    
    // Ativa o audio contexto para evitar bloqueios de background
    initAudio();

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, remainingRef.current - elapsed);
      
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        onTick(0);
        playBeep(880, 0.5);
        playBeep(440, 0.5);
        onComplete();
      } else {
        onTick(Math.ceil(remaining));
      }
    }, 100);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [durationSeconds, playBeep, onComplete, initAudio]);
  
  // Cleanup completo
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);
  
  return { start, playBeep };
};
