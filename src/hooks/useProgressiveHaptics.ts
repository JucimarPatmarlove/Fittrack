import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const useProgressiveHaptics = () => {
    const triggerRestTimerHaptic = (secondsRemaining: number) => {
        if (Capacitor.isNativePlatform()) {
            if (secondsRemaining === 3) Haptics.impact({ style: ImpactStyle.Light });
            else if (secondsRemaining === 1) Haptics.impact({ style: ImpactStyle.Medium });
            else if (secondsRemaining === 0) Haptics.impact({ style: ImpactStyle.Heavy });
            return;
        }
        if (!navigator.vibrate) return;

        if (secondsRemaining === 3) {
            navigator.vibrate(100); // aviso curto
        } else if (secondsRemaining === 1) {
            navigator.vibrate([200, 50, 200]); // padrão de urgência
        } else if (secondsRemaining === 0) {
            navigator.vibrate([500, 100, 500]); // finalização
        }
    };

    const triggerRepCompletionHaptic = (isPR: boolean) => {
        if (Capacitor.isNativePlatform()) {
            if (isPR) Haptics.impact({ style: ImpactStyle.Heavy });
            else Haptics.impact({ style: ImpactStyle.Light });
            return;
        }
        if (!navigator.vibrate) return;
        
        if (isPR) {
            navigator.vibrate([100, 50, 100, 50, 200]); // celebração
        } else {
            navigator.vibrate(50); // confirmação suave
        }
    };

    // Synthesizer beep via Web Audio API 
    const playAlertBeep = (frequency = 587.33, duration = 0.15, count = 2) => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            
            // Re-use context if already created to prevent policy errors, we'll store it on window just for this singleton usage or create a new one briefly.
            let audioCtx = (window as any)._fittrackAudioCtx;
            if (!audioCtx) {
                audioCtx = new AudioContextClass();
                (window as any)._fittrackAudioCtx = audioCtx;
            }
            
            let time = audioCtx.currentTime;
            
            for (let i = 0; i < count; i++) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = "sine";
                osc.frequency.setValueAtTime(frequency, time);
                
                gain.gain.setValueAtTime(0.12, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(time);
                osc.stop(time + duration);
                
                time += duration + 0.08;
            }
        } catch (err) {
            console.warn("Unable to play sound due to browser interaction constraints:", err);
        }
    };

    return { triggerRestTimerHaptic, triggerRepCompletionHaptic, playAlertBeep };
};

