// Singleton para manter o contexto de áudio vivo e desbloqueado
let audioCtx: AudioContext | null = null;
let unlocked = false;

export function initAudio() {
  if (unlocked) return;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    audioCtx = new AudioContextClass();

    // Criar um buffer vazio de 1 milissegundo e tocá-lo silenciosamente
    // Isto prova ao browser que o áudio foi iniciado por uma ação do utilizador
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);

    unlocked = true;
  } catch (e) {
    console.warn('Erro ao inicializar AudioContext:', e);
  }
}

export function playBeep() {
  if (!unlocked || !audioCtx) {
    // Fallback para o método clássico caso a inicialização tenha falhado
    const audio = new Audio('/beep.mp3');
    audio.volume = 0.5;
    audio.play().catch((e) => console.warn('Autoplay bloqueado:', e));
    return;
  }

  try {
    // Se o contexto foi suspenso pelo sistema operativo, acorda-o
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Oscilador sintético rápido e perfurante (Estilo Cyberpunk/Neon)
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    console.warn('Erro ao reproduzir beep sintético:', e);
  }
}
