import { useEffect, useRef, useCallback } from 'react';
import { useMachine } from './useMachine';
import { audioMachine } from './audioMachine';

export interface CoachMessage {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useAudioCoach(enabled: boolean = true) {
  // We use our custom state machine
  // We have to extract initialState and reducer from audioMachine
  // Wait, in audioMachine.ts it was exported as createMachine result.
  // Actually, audioMachine has initialState and states.
  // I'll adjust useMachine to work with it.
  const [state, send] = useMachine(
    audioMachine.initialState, 
    {}, // context not used in this machine
    (currentState, event) => {
      // Very simple state machine evaluator based on audioMachine structure
      const stateConfig = audioMachine.states[currentState.value.status as keyof typeof audioMachine.states] as any;
      if (!stateConfig || !stateConfig.on || !stateConfig.on[event.type]) return currentState;
      
      const transition = stateConfig.on[event.type];
      let targetStatus;
      
      if (typeof transition.target === 'function') {
        targetStatus = transition.target(currentState.value, event);
      } else {
        targetStatus = transition.target;
      }
      
      return { ...currentState, value: targetStatus };
    }
  );

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSpeaking = state.value.status === 'speaking';
  const isPaused = state.value.status === 'paused';
  const isIdle = state.value.status === 'idle';

  const speak = useCallback((message: CoachMessage | string) => {
    if (!enabled) return;
    const text = typeof message === 'string' ? message : message.text;
    send({ type: 'SPEAK', message: text });
  }, [enabled, send]);

  const pause = useCallback(() => {
    speechSynthesis.pause();
    send({ type: 'PAUSE' });
  }, [send]);

  const resume = useCallback(() => {
    speechSynthesis.resume();
    send({ type: 'RESUME' });
  }, [send]);

  const clear = useCallback(() => {
    speechSynthesis.cancel();
    send({ type: 'CLEAR' });
  }, [send]);

  const end = useCallback(() => {
    send({ type: 'END' });
  }, [send]);

  // Effect to handle actual speech synthesis when state changes to speaking
  useEffect(() => {
    if (state.value.status === 'speaking' && state.value.message) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(state.value.message);
      utterance.lang = 'pt-PT';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      
      utterance.onend = () => {
        end();
      };
      
      utterance.onerror = () => {
        clear();
      };
      
      speechSynthesis.speak(utterance);
      utteranceRef.current = utterance;
    }
  }, [state.value.status, state.value.message, end, clear]);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  return { state: state.value, speak, cancel: clear, pause, resume, clear, end, isSpeaking, isPaused, isIdle };
}
