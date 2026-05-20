import { useState, useEffect, useRef, useCallback } from 'react';

interface MotionCounterOptions {
  sensitivity?: number;      // threshold de aceleração (m/s²) - padrão 12
  debounceMs?: number;       // tempo mínimo entre repetições (ms) - padrão 300
  onRep?: () => void;
}

export function useMotionCounter({ sensitivity = 12, debounceMs = 300, onRep }: MotionCounterOptions = {}) {
  const [isActive, setIsActive] = useState(false);
  const [count, setCount] = useState(0);
  const lastRepTime = useRef(0);
  const peakDetected = useRef(false);
  const lastMagnitude = useRef(0);
  const motionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isActive) return;
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const { x = 0, y = 0, z = 0 } = acc;
    // Cálculo da magnitude total (inclui gravidade, mas o limiar compensa)
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    // Detecção de pico: magnitude acima do limiar e não está em período de cooldown
    if (magnitude > sensitivity && !peakDetected.current && (now - lastRepTime.current) > debounceMs) {
      peakDetected.current = true;
      lastRepTime.current = now;
      setCount(prev => prev + 1);
      onRep?.();
      // Reseta o estado do pico após um curto período (para evitar múltiplos picos da mesma repetição)
      setTimeout(() => {
        peakDetected.current = false;
      }, 150);
    } else if (magnitude <= sensitivity) {
      peakDetected.current = false;
    }
    lastMagnitude.current = magnitude;
  }, [isActive, sensitivity, debounceMs, onRep]);

  motionHandlerRef.current = handleMotion;

  const start = useCallback(async () => {
    // Verifica se é iOS (requer permissão explícita)
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          setIsActive(true);
        } else {
          console.warn('Permissão para sensores de movimento negada');
        }
      } catch (error) {
        console.error('Erro ao pedir permissão DeviceMotion', error);
      }
    } else {
      // Android e outros: permissão implícita
      setIsActive(true);
    }
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setCount(0);
    peakDetected.current = false;
    lastRepTime.current = 0;
  }, []);

  const resetCount = useCallback(() => setCount(0), []);

  useEffect(() => {
    if (!isActive) return;
    window.addEventListener('devicemotion', motionHandlerRef.current!);
    return () => {
      window.removeEventListener('devicemotion', motionHandlerRef.current!);
    };
  }, [isActive]);

  return { isActive, count, start, stop, resetCount };
}
