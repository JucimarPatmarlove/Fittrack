export const useProgressiveHaptics = () => {
    const triggerRestTimerHaptic = (secondsRemaining: number) => {
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
        if (!navigator.vibrate) return;
        
        if (isPR) {
            navigator.vibrate([100, 50, 100, 50, 200]); // celebração
        } else {
            navigator.vibrate(50); // confirmação suave
        }
    };

    return { triggerRestTimerHaptic, triggerRepCompletionHaptic };
};
