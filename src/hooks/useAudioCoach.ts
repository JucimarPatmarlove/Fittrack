import { useRef, useCallback, useEffect } from 'react';

export interface CoachMessage {
  text: string;
  rate?: number;    // velocidade da fala (0.5 a 2)
  pitch?: number;   // tom (0 a 2)
  volume?: number;  // volume (0 a 1)
}

export function useAudioCoach(enabled: boolean = true) {
  const queueRef = useRef<CoachMessage[]>([]);
  const isSpeakingRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const processQueue = useCallback(() => {
    if (!enabled) return;
    if (queueRef.current.length === 0) {
      isSpeakingRef.current = false;
      return;
    }
    if (isSpeakingRef.current) return;

    isSpeakingRef.current = true;
    const next = queueRef.current.shift()!;
    const utterance = new SpeechSynthesisUtterance(next.text);
    utterance.rate = next.rate ?? 0.95;
    utterance.pitch = next.pitch ?? 1.05;
    utterance.volume = next.volume ?? 0.9;
    utterance.lang = 'pt-PT';
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setTimeout(processQueue, 150);
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      processQueue();
    };
    speechSynthesis.cancel(); // interrompe qualquer fala anterior
    speechSynthesis.speak(utterance);
    utteranceRef.current = utterance;
  }, [enabled]);

  const speak = useCallback((message: CoachMessage | string, priority: boolean = false) => {
    if (!enabled) return;
    
    const msgObj = typeof message === 'string' ? { text: message } : message;
    
    if (priority) {
      speechSynthesis.cancel();
      queueRef.current = [msgObj];
      isSpeakingRef.current = false;
    } else {
      queueRef.current.push(msgObj);
    }
    processQueue();
  }, [enabled, processQueue]);

  const cancel = useCallback(() => {
    speechSynthesis.cancel();
    queueRef.current = [];
    isSpeakingRef.current = false;
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { speak, cancel, isSpeaking: isSpeakingRef.current };
}
