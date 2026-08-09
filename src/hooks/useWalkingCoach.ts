import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkoutSession } from '../db/schema';
import { startSilentAudio, stopSilentAudio } from '../utils/silentAudio';

// ── TIPOS ────────────────────────────────────────────────────────────────────

export interface Hazard {
  id: string;
  lat: number;
  lng: number;
  type: 'water' | 'danger' | 'info';
}

interface CoachState {
  isActive: boolean;
  isPaused: boolean;
  distance: number;
  duration: number;
  pace: number;
  gap: number; // Grade Adjusted Pace (min/km corrigido por inclinação)
  altitude: number; // Altitude corrente (metros)
  elevationGain: number; // Ganho de elevação acumulado (metros)
  steps: number;
  speed: number;
  heartRate: number; // BPM (simulado — TODO: Web Bluetooth)
  ghostDistance: number; // Distância percorrida pelo fantasma (km)
  hazards: Hazard[]; // Marcadores crowdsource
  isRunningSuggestion: boolean;
  isRunningChallenge: boolean;
  runChallengeTimeLeft: number;
  alertMessage: string | null;
  path: { lat: number; lng: number }[];
}

interface GPSPoint {
  lat: number;
  lng: number;
  alt: number;
  timestamp: number;
}

// ── HOOK PRINCIPAL ───────────────────────────────────────────────────────────

export function useWalkingCoach(targetPace = 8.0, ghostSpeedKmh = 5.5) {
  const [state, setState] = useState<CoachState>({
    isActive: false,
    isPaused: false,
    distance: 0,
    duration: 0,
    pace: 0,
    gap: 0,
    altitude: 0,
    elevationGain: 0,
    steps: 0,
    speed: 0,
    heartRate: 72,
    ghostDistance: 0,
    hazards: [],
    isRunningSuggestion: false,
    isRunningChallenge: false,
    runChallengeTimeLeft: 0,
    alertMessage: null,
    path: [],
  });

  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<any>(null);
  const lastCoords = useRef<GPSPoint | null>(null);

  // Accumulated totals
  const totalDistance = useRef<number>(0);
  const totalElevation = useRef<number>(0);
  const activeDuration = useRef<number>(0);
  const lastTickTime = useRef<number | null>(null);

  // Sliding window for Rolling Average Pace
  const paceWindow = useRef<{ dist: number; time: number }[]>([]);

  // Challenge and Pause tracking
  const goodPaceStartTime = useRef<number | null>(null);
  const pauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const challengeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step sensor
  const stepCount = useRef<number>(0);
  const lastAcceleration = useRef<number>(0);

  // Ghost & HR spoken feedback cooldown
  const lastGhostFeedbackTime = useRef<number>(0);

  // --- WAKE LOCK ---
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && state.isActive && !state.isPaused) {
      try {
        if (wakeLock.current) return;
        wakeLock.current = await (navigator as any).wakeLock.request('screen');

        wakeLock.current.addEventListener('release', () => {
          console.log('Wake Lock released (ecrã pode desligar-se)');
          wakeLock.current = null;
        });
        console.log('Wake Lock adquirido com sucesso!');
      } catch (err) {
        console.warn('Wake Lock falhou (pode estar em modo poupança de bateria):', err);
      }
    }
  }, [state.isActive, state.isPaused]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock.current) {
      try {
        await wakeLock.current.release();
        wakeLock.current = null;
      } catch (err) {
        console.warn('Wake Lock release falhou:', err);
      }
    }
  }, []);

  // Re-adquirir Wake Lock se a app voltar a ficar visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isActive && !state.isPaused) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [requestWakeLock, state.isActive, state.isPaused]);

  // --- MOTOR TTS ---
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-PT';
      utterance.rate = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find((v) => v.lang.startsWith('pt'));
      if (ptVoice) utterance.voice = ptVoice;

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // --- SENSOR DE PASSOS ---
  useEffect(() => {
    if (!state.isActive || state.isPaused) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const threshold = 12.0;

      if (magnitude > threshold && lastAcceleration.current < threshold) {
        stepCount.current += 1;
        setState((prev) => ({ ...prev, steps: stepCount.current }));
      }
      lastAcceleration.current = magnitude;
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion, { passive: true } as any);
    }

    return () => {
      if (window.DeviceMotionEvent) window.removeEventListener('devicemotion', handleMotion);
    };
  }, [state.isActive, state.isPaused]);

  // --- DURATION TICKER (só incrementa se não estiver em pausa) ---
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      lastTickTime.current = Date.now();
      durationInterval.current = setInterval(() => {
        const now = Date.now();
        const delta = (now - (lastTickTime.current || now)) / 1000;
        activeDuration.current += delta;
        lastTickTime.current = now;
        setState((prev) => ({ ...prev, duration: activeDuration.current }));
      }, 1000);
    } else {
      if (durationInterval.current) clearInterval(durationInterval.current);
      lastTickTime.current = null;
    }
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, [state.isActive, state.isPaused]);

  // ──────────────────────────────────────────────────────────────────────────
  // 👻 MECÂNICA 3: Ghost Pacer + ❤️ MECÂNICA 4: Simulação HR & Proteção
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isActive || state.isPaused) return;

    const interval = setInterval(() => {
      setState((prev) => {
        // Ghost avança a velocidade configurável (km/s = km/h ÷ 3600)
        const newGhostDist = prev.ghostDistance + ghostSpeedKmh / 3600;

        // Simulação de HR (substituir por Web Bluetooth quando disponível)
        let newHR: number;
        if (prev.isRunningChallenge) {
          // HR sobe durante challenge
          newHR = Math.min(185, prev.heartRate + (Math.random() * 3 + 1));
        } else {
          // Flutuação normal ±2 BPM
          newHR = Math.max(60, Math.min(160, prev.heartRate + (Math.random() * 4 - 2)));
        }

        // 🛡️ Proteção Cardíaca: Abort automático se HR > 180 em challenge
        if (newHR > 180 && prev.isRunningChallenge) {
          speak('Alerta vermelho. Frequência cardíaca no limite. Reduz o ritmo imediatamente.');
          return {
            ...prev,
            heartRate: newHR,
            ghostDistance: newGhostDist,
            isRunningChallenge: false,
            runChallengeTimeLeft: 0,
            alertMessage: '⚠️ Corrida abortada: Zona 5 de HR.',
          };
        }

        // 👻 Feedback do Ghost a cada 5 minutos
        const now = Date.now();
        if (now - lastGhostFeedbackTime.current > 300000 && prev.duration > 60) {
          lastGhostFeedbackTime.current = now;
          if (prev.distance > newGhostDist) {
            speak('Estás à frente do teu recorde pessoal. Mantém!');
          } else {
            speak('O Fantasma ultrapassou-te. Acelera!');
          }
        }

        return { ...prev, heartRate: newHR, ghostDistance: newGhostDist };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isActive, state.isPaused, ghostSpeedKmh, speak]);

  // ──────────────────────────────────────────────────────────────────────────
  // 🗺️ MOTOR GPS com ⛰️ MECÂNICA 1: Altimetria e GAP
  // ──────────────────────────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada no teu dispositivo.');
      return;
    }

    await requestWakeLock();

    startSilentAudio(() => {
      console.warn(
        '[WalkingCoach] Utilizador negou permissão de áudio, continuando sem background audio.',
      );
    });

    // Reset counters
    totalDistance.current = 0;
    totalElevation.current = 0;
    activeDuration.current = 0;
    stepCount.current = 0;
    lastCoords.current = null;
    paceWindow.current = [];
    goodPaceStartTime.current = null;
    lastGhostFeedbackTime.current = Date.now();

    // Set UI to active immediately
    setState((prev) => ({
      ...prev,
      isActive: true,
      alertMessage: 'A procurar sinal GPS...',
      path: [],
      hazards: [],
      ghostDistance: 0,
      heartRate: 72,
      altitude: 0,
      elevationGain: 0,
      gap: 0,
    }));

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords;
        const now = Date.now();
        const currentAlt = altitude || 0;

        // JITTER FILTER
        if (accuracy > 30) return;

        if (lastCoords.current) {
          const prev = lastCoords.current;
          const timeDelta = (now - prev.timestamp) / 1000;

          const R = 6371;
          const dLat = (latitude - prev.lat) * (Math.PI / 180);
          const dLon = (longitude - prev.lng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(prev.lat * (Math.PI / 180)) *
              Math.cos(latitude * (Math.PI / 180)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

          // ⛰️ Acumulação de elevação (só subidas contam)
          if (currentAlt > prev.alt + 0.5) {
            // Filtro de 0.5m para jitter altimétrico
            totalElevation.current += currentAlt - prev.alt;
          }

          if (timeDelta > 0) {
            const instSpeed = (dist / timeDelta) * 3600;
            // AUTO-PAUSE LOGIC (If moving < 1.5 km/h for > 10s, pause)
            if (instSpeed < 1.5) {
              if (!pauseTimeout.current) {
                pauseTimeout.current = setTimeout(() => {
                  setState((prev) => {
                    if (!prev.isPaused) speak('Treino em pausa.');
                    return { ...prev, isPaused: true };
                  });
                }, 10000);
              }
            } else {
              if (pauseTimeout.current) {
                clearTimeout(pauseTimeout.current);
                pauseTimeout.current = null;
              }
              setState((prev) => {
                if (prev.isPaused) speak('A retomar o treino.');
                return { ...prev, isPaused: false };
              });

              // Only accumulate distance if active
              if (dist > 0.001 && dist < 0.2) {
                totalDistance.current += dist;

                // ROLLING AVERAGE PACE
                paceWindow.current.push({ dist, time: timeDelta });
                if (paceWindow.current.length > 5) paceWindow.current.shift();

                const sumDist = paceWindow.current.reduce((sum, item) => sum + item.dist, 0);
                const sumTime = paceWindow.current.reduce((sum, item) => sum + item.time, 0);

                const speedKmh = sumTime > 0 ? (sumDist / sumTime) * 3600 : 0;
                const paceMinKm = speedKmh > 0 ? 60 / speedKmh : 0;

                // ⛰️ Grade Adjusted Pace (GAP)
                // Gradiente = elevação / distância horizontal
                // Factor: cada 1% de inclinação adiciona ~3-5% ao esforço
                const distMeters = totalDistance.current * 1000;
                let gapValue = paceMinKm;
                if (distMeters > 10 && totalElevation.current > 0) {
                  const gradient = totalElevation.current / distMeters; // ex: 0.05 = 5%
                  const gapFactor = 1 - gradient * 3.5; // Reduz pace (mais rápido "equivalente")
                  gapValue = Math.max(paceMinKm * gapFactor, paceMinKm * 0.6); // Clamp a 60% do pace
                }

                setState((prev) => ({
                  ...prev,
                  distance: totalDistance.current,
                  speed: speedKmh,
                  pace: paceMinKm,
                  gap: gapValue,
                  altitude: currentAlt,
                  elevationGain: totalElevation.current,
                  path: [...prev.path, { lat: latitude, lng: longitude }],
                }));
              }
            }
          }
        }

        lastCoords.current = { lat: latitude, lng: longitude, alt: currentAlt, timestamp: now };
      },
      (error) => {
        console.error('Erro GPS:', error);
        setState((prev) => ({
          ...prev,
          alertMessage: `Aviso GPS: ${error.message} (Testar no PC pode falhar)`,
        }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  }, [requestWakeLock, speak]);

  // ──────────────────────────────────────────────────────────────────────────
  // 🏁 FINISH TRACKING (preserva gravação de sessão)
  // ──────────────────────────────────────────────────────────────────────────
  const finishTracking = useCallback(() => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    if (challengeInterval.current) clearInterval(challengeInterval.current);
    if (durationInterval.current) clearInterval(durationInterval.current);

    stopSilentAudio();
    releaseWakeLock();

    // Reset internal refs
    lastCoords.current = null;
    goodPaceStartTime.current = null;

    setState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      isRunningSuggestion: false,
      isRunningChallenge: false,
      path: [],
      hazards: [],
      ghostDistance: 0,
      heartRate: 72,
      altitude: 0,
      elevationGain: 0,
      gap: 0,
    }));

    // BUILD WORKOUT SESSION FOR HISTORY
    const finalDistance = totalDistance.current;
    const finalDuration = activeDuration.current;
    const finalPace = finalDistance > 0 ? finalDuration / 60 / finalDistance : 0;
    const finalElevation = totalElevation.current;

    // Calorias ajustadas por elevação (+15% por cada 100m de ganho)
    const baseCalories = Math.round(finalDistance * 60);
    const elevationBonus = Math.round(finalElevation * 0.09); // ~9 cal por metro de elevação
    const calories = baseCalories + elevationBonus;

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      startTime: new Date(Date.now() - finalDuration * 1000).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.round(finalDuration / 60),
      name: 'Caminhada (Coach)',
      volume: 0,
      calories: calories,
      rpe: 5,
      completed: true,
      exercises: [
        {
          id: crypto.randomUUID(),
          exerciseId: 'walking-coach',
          name: 'Caminhada c/ Radar',
          sets: [{ reps: Math.round(finalDistance * 1000), weight: 0, completed: true }],
        },
      ],
      notes: `Radar: ${finalDistance.toFixed(2)}km em ${Math.round(finalDuration / 60)}min. Ritmo: ${finalPace.toFixed(2)} min/km. ⛰️ Elevação: +${finalElevation.toFixed(0)}m. GAP: ${state.gap > 0 ? state.gap.toFixed(1) : '--'} min/km.`,
    } as any;

    return { session, distance: finalDistance };
  }, [state, releaseWakeLock]);

  // ──────────────────────────────────────────────────────────────────────────
  // 🧠 Cérebro do Coach (Lógica de Alertas de Ritmo)
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isActive || state.isPaused || state.pace === 0) return;

    const currentPace = state.pace;
    const thresholdSlow = targetPace * 1.2;
    const thresholdFast = targetPace * 0.8;

    if (currentPace > thresholdSlow && state.duration > 30) {
      if (state.alertMessage !== 'Acelera o passo!') {
        speak('Atenção! Estás a abrandar. Acelera o passo!');
        setState((prev) => ({ ...prev, alertMessage: 'Acelera o passo!' }));
      }
    } else if (currentPace <= targetPace && currentPace >= thresholdFast) {
      if (state.alertMessage !== 'Bom ritmo!') {
        if (Math.floor(state.duration) % 60 === 0) speak('Bom ritmo! Continua assim.');
        setState((prev) => ({ ...prev, alertMessage: 'Bom ritmo!' }));
      }

      if (!goodPaceStartTime.current) goodPaceStartTime.current = Date.now();
      else if (
        Date.now() - goodPaceStartTime.current > 120000 &&
        !state.isRunningSuggestion &&
        !state.isRunningChallenge
      ) {
        setState((prev) => ({ ...prev, isRunningSuggestion: true }));
        speak('Estás num ótimo ritmo! Que tal correres 1 minuto agora? Aceita o desafio no ecrã.');
      }
    } else {
      goodPaceStartTime.current = null;
      if (state.isRunningSuggestion) setState((prev) => ({ ...prev, isRunningSuggestion: false }));
    }
  }, [
    state.pace,
    state.isActive,
    state.isPaused,
    state.duration,
    targetPace,
    speak,
    state.alertMessage,
    state.isRunningSuggestion,
    state.isRunningChallenge,
  ]);

  // ──────────────────────────────────────────────────────────────────────────
  // 🏃 Lógica do Desafio de Corrida
  // ──────────────────────────────────────────────────────────────────────────
  const acceptRunningChallenge = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunningSuggestion: false,
      isRunningChallenge: true,
      runChallengeTimeLeft: 60,
    }));
    speak('Bora! Corre durante 1 minuto. Vou contar!');

    let timeLeft = 60;
    if (challengeInterval.current) clearInterval(challengeInterval.current);

    challengeInterval.current = setInterval(() => {
      timeLeft -= 1;
      setState((prev) => ({ ...prev, runChallengeTimeLeft: timeLeft }));

      if (timeLeft === 30) speak('Força, faltam 30 segundos!');
      if (timeLeft === 10) speak('Últimos 10 segundos!');

      if (timeLeft <= 0) {
        clearInterval(challengeInterval.current!);
        setState((prev) => ({ ...prev, isRunningChallenge: false, runChallengeTimeLeft: 0 }));
        speak('Parabéns! Concluíste o desafio de corrida. Grande máquina!');
      }
    }, 1000);
  }, [speak]);

  // ──────────────────────────────────────────────────────────────────────────
  // 📍 MECÂNICA 2: Drop Hazard (Waze-style Crowdsource)
  // ──────────────────────────────────────────────────────────────────────────
  const dropHazard = useCallback(
    (type: 'water' | 'danger' | 'info') => {
      if (!lastCoords.current) {
        speak('Sem sinal GPS. Não é possível marcar.');
        return;
      }
      const newHazard: Hazard = {
        id: `hz_${Date.now()}`,
        lat: lastCoords.current.lat,
        lng: lastCoords.current.lng,
        type,
      };
      setState((prev) => ({ ...prev, hazards: [...prev.hazards, newHazard] }));

      const labels: Record<string, string> = {
        danger: 'Perigo marcado',
        water: 'Ponto de água marcado',
        info: 'Informação marcada',
      };
      speak(`${labels[type]} e partilhado com a rede.`);
    },
    [speak],
  );

  return { state, startTracking, finishTracking, acceptRunningChallenge, dropHazard, speak };
}
