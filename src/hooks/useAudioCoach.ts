// src/hooks/useAudioCoach.ts
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudioCoach() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [enabled, setEnabled] = useState(true); // Pode ser ativado/desativado nas opções do treino
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Pre-carregar vozes nativas (o evento voiceschanged é errático em PWA/mobile)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        setVoices(allVoices);
        // Procurar voz em Português (PT-PT ou PT-BR)
        const ptVoice = allVoices.find(v => v.lang.includes('pt-PT') || v.lang.includes('pt_PT')) ||
                        allVoices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt'));
        if (ptVoice) {
          preferredVoiceRef.current = ptVoice;
        } else {
          // Fallback para primeira disponível
          preferredVoiceRef.current = allVoices[0];
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speak = useCallback((text: string, priority: boolean = false) => {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Se for mensagem prioritária (ex: RPE crítico), limpar a fila atual
      if (priority) {
        window.speechSynthesis.cancel();
      } else if (window.speechSynthesis.speaking) {
        // Se já está a falar algo não prioritário, não atropelar
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (preferredVoiceRef.current) {
        utterance.voice = preferredVoiceRef.current;
      }
      
      // Ajustes Fisiológicos de Ginásio: Cadência e Tom firmes
      utterance.rate = 1.05; // Ligeiramente mais rápido que o normal
      utterance.pitch = 0.95; // Tom ligeiramente mais grave/sério

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Falha no Audio Coaching TTS", e);
    }
  }, [enabled]);

  const toggleAudio = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  return {
    speak,
    enabled,
    toggleAudio,
    hasSupport: typeof window !== 'undefined' && 'speechSynthesis' in window
  };
}
