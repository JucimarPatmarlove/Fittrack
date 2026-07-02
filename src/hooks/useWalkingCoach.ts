import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutSession } from '../db/schema';
import { startSilentAudio, stopSilentAudio } from '../utils/silentAudio';

interface CoachState {
  isActive: boolean;
  isPaused: boolean; // Auto-pause state
  distance: number;
  duration: number; // Active duration only
  pace: number;
  steps: number;
  speed: number;
  isRunningSuggestion: boolean;
  isRunningChallenge: boolean;
  runChallengeTimeLeft: number;
  alertMessage: string | null;
}

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export function useWalkingCoach(targetPace: number = 8.0) {
  const [state, setState] = useState<CoachState>({
    isActive: false, isPaused: false, distance: 0, duration: 0, pace: 0,
    steps: 0, speed: 0, isRunningSuggestion: false,
    isRunningChallenge: false, runChallengeTimeLeft: 0, alertMessage: null,
  });

  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<any>(null);
  const lastCoords = useRef<GPSPoint | null>(null);
  
  // Accumulated totals
  const totalDistance = useRef<number>(0);
  const activeDuration = useRef<number>(0); // in seconds
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
      const ptVoice = voices.find(v => v.lang.startsWith('pt'));
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
      
      if (magnitude > threshold && (lastAcceleration.current < threshold)) {
        stepCount.current += 1;
        setState(prev => ({ ...prev, steps: stepCount.current }));
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

  // --- DURATION TICKER (so incrementa se não estiver em pausa) ---
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      lastTickTime.current = Date.now();
      durationInterval.current = setInterval(() => {
        const now = Date.now();
        const delta = (now - (lastTickTime.current || now)) / 1000;
        activeDuration.current += delta;
        lastTickTime.current = now;
        setState(prev => ({ ...prev, duration: activeDuration.current }));
      }, 1000);
    } else {
      if (durationInterval.current) clearInterval(durationInterval.current);
      lastTickTime.current = null;
    }
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, [state.isActive, state.isPaused]);

  // --- MOTOR GPS ---
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada no teu dispositivo.');
      return;
    }

    await requestWakeLock();

    startSilentAudio(() => {
      console.warn('[WalkingCoach] Utilizador negou permissão de áudio, continuando sem background audio.');
    });

    // Reset counters
    totalDistance.current = 0;
    activeDuration.current = 0;
    stepCount.current = 0;
    lastCoords.current = null;
    paceWindow.current = [];
    goodPaceStartTime.current = null;
    
    // Set UI to active immediately
    setState(prev => ({ ...prev, isActive: true, alertMessage: 'A procurar sinal GPS...' }));

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const now = Date.now();

        // JITTER FILTER
        if (accuracy > 30) return; // Ignore very bad signals

        if (lastCoords.current) {
          const prev = lastCoords.current;
          const timeDelta = (now - prev.timestamp) / 1000;
          
          const R = 6371;
          const dLat = (latitude - prev.lat) * (Math.PI / 180);
          const dLon = (longitude - prev.lng) * (Math.PI / 180);
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(prev.lat * (Math.PI / 180)) * Math.cos(latitude * (Math.PI / 180)) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
          
          if (timeDelta > 0) {
             const instSpeed = (dist / timeDelta) * 3600;
             // AUTO-PAUSE LOGIC (If moving < 1.5 km/h for > 10s, pause)
             if (instSpeed < 1.5) {
               if (!pauseTimeout.current) {
                 pauseTimeout.current = setTimeout(() => {
                   setState(prev => {
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
               setState(prev => {
                 if (prev.isPaused) speak('A retomar o treino.');
                 return { ...prev, isPaused: false };
               });
               
               // Only accumulate distance if active
               if (dist > 0.001 && dist < 0.2) { // also ignore jumps > 200m
                 totalDistance.current += dist;
                 
                 // ROLLING AVERAGE PACE
                 paceWindow.current.push({ dist, time: timeDelta });
                 if (paceWindow.current.length > 5) paceWindow.current.shift(); // keep last 5 readings
                 
                 const sumDist = paceWindow.current.reduce((sum, item) => sum + item.dist, 0);
                 const sumTime = paceWindow.current.reduce((sum, item) => sum + item.time, 0);
                 
                 const speedKmh = sumTime > 0 ? (sumDist / sumTime) * 3600 : 0;
                 const paceMinKm = speedKmh > 0 ? 60 / speedKmh : 0;

                 setState(prev => ({
                    ...prev,
                    distance: totalDistance.current,
                    speed: speedKmh,
                    pace: paceMinKm,
                 }));
               }
             }
          }
        }

        lastCoords.current = { lat: latitude, lng: longitude, timestamp: now };
      },
      (error) => {
        console.error('Erro GPS:', error);
        setState(prev => ({ ...prev, alertMessage: `Aviso GPS: ${error.message} (Testar no PC pode falhar)` }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [requestWakeLock]);

  const finishTracking = useCallback(() => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    if (challengeInterval.current) clearInterval(challengeInterval.current);
    if (durationInterval.current) clearInterval(durationInterval.current);
    
    stopSilentAudio();
    releaseWakeLock();

    const finalState = { ...state };
    
    // Reset internal refs
    lastCoords.current = null;
    goodPaceStartTime.current = null;
    
    setState(prev => ({ ...prev, isActive: false, isPaused: false, isRunningSuggestion: false, isRunningChallenge: false }));
    
    // BUILD WORKOUT SESSION FOR HISTORY
    const finalDistance = totalDistance.current; // km
    const finalDuration = activeDuration.current; // seconds
    const finalPace = finalDistance > 0 ? (finalDuration / 60) / finalDistance : 0;
    
    // Calculate simple calories: avg 60 kcal per km walked
    const calories = Math.round(finalDistance * 60);

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      startTime: new Date(Date.now() - finalDuration * 1000).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.round(finalDuration / 60), // em minutos
      name: 'Caminhada (Coach)',
      volume: 0,
      calories: calories,
      rpe: 5,
      completed: true,
      exercises: [{
        id: crypto.randomUUID(),
        exerciseId: 'walking-coach',
        name: 'Caminhada c/ Radar',
        sets: [{ reps: Math.round(finalDistance * 1000), weight: 0, completed: true }] // Mapeamos m para reps como hack temporário
      }],
      notes: `Radar registou: ${finalDistance.toFixed(2)}km em ${Math.round(finalDuration/60)} min. Ritmo: ${finalPace.toFixed(2)} min/km.`
    };

    return { session, distance: finalDistance };
  }, [state]);

  // Cérebro do Coach (Lógica de Alertas)
  useEffect(() => {
    if (!state.isActive || state.isPaused || state.pace === 0) return;

    const currentPace = state.pace;
    const thresholdSlow = targetPace * 1.2;
    const thresholdFast = targetPace * 0.8;

    if (currentPace > thresholdSlow && state.duration > 30) {
      if (state.alertMessage !== 'Acelera o passo!') {
        speak('Atenção! Estás a abrandar. Acelera o passo!');
        setState(prev => ({ ...prev, alertMessage: 'Acelera o passo!' }));
      }
    } else if (currentPace <= targetPace && currentPace >= thresholdFast) {
      if (state.alertMessage !== 'Bom ritmo!') {
        if (Math.floor(state.duration) % 60 === 0) speak('Bom ritmo! Continua assim.');
        setState(prev => ({ ...prev, alertMessage: 'Bom ritmo!' }));
      }
      
      if (!goodPaceStartTime.current) goodPaceStartTime.current = Date.now();
      else if (Date.now() - goodPaceStartTime.current > 120000 && !state.isRunningSuggestion && !state.isRunningChallenge) {
        setState(prev => ({ ...prev, isRunningSuggestion: true }));
        speak('Estás num ótimo ritmo! Que tal correres 1 minuto agora? Aceita o desafio no ecrã.');
      }
    } else {
      goodPaceStartTime.current = null;
      if (state.isRunningSuggestion) setState(prev => ({ ...prev, isRunningSuggestion: false }));
    }
  }, [state.pace, state.isActive, state.isPaused, state.duration, targetPace, speak, state.alertMessage, state.isRunningSuggestion, state.isRunningChallenge]);

  // Lógica do Desafio
  const acceptRunningChallenge = useCallback(() => {
    setState(prev => ({ ...prev, isRunningSuggestion: false, isRunningChallenge: true, runChallengeTimeLeft: 60 }));
    speak('Bora! Corre durante 1 minuto. Vou contar!');

    let timeLeft = 60;
    if (challengeInterval.current) clearInterval(challengeInterval.current);
    
    challengeInterval.current = setInterval(() => {
      timeLeft -= 1;
      setState(prev => ({ ...prev, runChallengeTimeLeft: timeLeft }));
      
      if (timeLeft === 30) speak('Força, faltam 30 segundos!');
      if (timeLeft === 10) speak('Últimos 10 segundos!');

      if (timeLeft <= 0) {
        clearInterval(challengeInterval.current!);
        setState(prev => ({ ...prev, isRunningChallenge: false, runChallengeTimeLeft: 0 }));
        speak('Parabéns! Concluíste o desafio de corrida. Grande máquina!');
      }
    }, 1000);
  }, [speak]);

  return { state, startTracking, finishTracking, acceptRunningChallenge, speak };
}
