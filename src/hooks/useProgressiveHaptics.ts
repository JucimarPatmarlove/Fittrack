import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

type HapticLevel = 'LIGHT' | 'MEDIUM' | 'HEAVY';

const IMPACT_STYLE_MAP: Record<HapticLevel, ImpactStyle> = {
  LIGHT: ImpactStyle.Light,
  MEDIUM: ImpactStyle.Medium,
  HEAVY: ImpactStyle.Heavy,
};

const WEB_VIBRATION_PATTERNS: Record<HapticLevel, number | number[]> = {
  LIGHT: 100,
  MEDIUM: [200, 50, 200],
  HEAVY: [500, 100, 500],
};

const REST_TIMER_HAPTICS: Record<number, HapticLevel> = {
  3: 'LIGHT',
  1: 'MEDIUM',
  0: 'HEAVY',
};

const PR_CELEBRATION_PATTERN = [100, 50, 100, 50, 200];
const CONFIRMATION_PATTERN = 50;

// ---- Pure utility functions ----

/** Trigger native haptic feedback via Capacitor */
function triggerNativeHaptic(level: HapticLevel): void {
  Haptics.impact({ style: IMPACT_STYLE_MAP[level] });
}

/** Trigger web vibration API */
function triggerWebVibration(level: HapticLevel): void {
  if (!navigator.vibrate) return;
  navigator.vibrate(WEB_VIBRATION_PATTERNS[level]);
}

/** Trigger a web vibration pattern */
function triggerWebPattern(pattern: number | number[]): void {
  if (!navigator.vibrate) return;
  navigator.vibrate(pattern);
}

/** Create and play an audio beep using Web Audio API */
function createBeepSound(
  audioCtx: AudioContext,
  frequency: number,
  duration: number,
  startTime: number
): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.12, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Get or create shared AudioContext */
function getAudioContext(): AudioContext | null {
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  let audioCtx = (window as any)._fittrackAudioCtx;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
    (window as any)._fittrackAudioCtx = audioCtx;
  }
  return audioCtx;
}

// ---- Haptic triggering ----

/** Trigger haptic at a given level across native or web platforms */
function triggerHaptic(level: HapticLevel): void {
  if (Capacitor.isNativePlatform()) {
    triggerNativeHaptic(level);
    return;
  }
  triggerWebVibration(level);
}

// ---- React Hook ----

export const useProgressiveHaptics = () => {
  const triggerRestTimerHaptic = (secondsRemaining: number) => {
    const level = REST_TIMER_HAPTICS[secondsRemaining];
    if (level) triggerHaptic(level);
  };

  const triggerRepCompletionHaptic = (isPR: boolean) => {
    if (Capacitor.isNativePlatform()) {
      triggerNativeHaptic(isPR ? 'HEAVY' : 'LIGHT');
      return;
    }
    triggerWebPattern(isPR ? PR_CELEBRATION_PATTERN : CONFIRMATION_PATTERN);
  };

  // Synthesizer beep via Web Audio API
  const playAlertBeep = (frequency = 587.33, duration = 0.15, count = 2) => {
    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) return;

      let time = audioCtx.currentTime;
      for (let i = 0; i < count; i++) {
        createBeepSound(audioCtx, frequency, duration, time);
        time += duration + 0.08;
      }
    } catch (err) {
      console.warn('Unable to play sound due to browser interaction constraints:', err);
    }
  };

  return { triggerRestTimerHaptic, triggerRepCompletionHaptic, playAlertBeep };
};