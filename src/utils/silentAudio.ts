// src/utils/silentAudio.ts
// Áudio mudo em loop para permitir background tracking no iOS/Android

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying = false;

/**
 * Inicia um áudio silencioso em loop para manter a app ativa em background.
 * @param onPermissionDenied Callback quando o utilizador nega permissão de áudio.
 */
export function startSilentAudio(onPermissionDenied?: () => void): void {
  if (isPlaying) return;

  try {
    // Criar contexto de áudio
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Se o contexto estiver suspenso (autoplay policy), tenta retomar
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {
        onPermissionDenied?.();
        return;
      });
    }

    // Oscilador com frequência muito baixa (quase inaudível)
    oscillator = audioContext.createOscillator();
    oscillator.frequency.value = 0.1; // 0.1 Hz (praticamente silêncio)
    oscillator.type = 'sine';

    // Ganho zero (silêncio absoluto)
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.0; // Volume zero

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.loop = true;
    isPlaying = true;

    console.log('[SilentAudio] Áudio silencioso iniciado para background tracking.');
  } catch (error) {
    console.warn('[SilentAudio] Falha ao iniciar áudio silencioso:', error);
    onPermissionDenied?.();
  }
}

/**
 * Para o áudio silencioso.
 */
export function stopSilentAudio(): void {
  if (!isPlaying) return;

  try {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      oscillator = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
    isPlaying = false;
    console.log('[SilentAudio] Áudio silencioso parado.');
  } catch (error) {
    console.warn('[SilentAudio] Erro ao parar áudio:', error);
  }
}

/**
 * Verifica se o áudio silencioso está ativo.
 */
export function isSilentAudioActive(): boolean {
  return isPlaying;
}
