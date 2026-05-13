import { useState, useEffect } from 'react';
import { useLS } from './index';
import { PredictiveChallenges, Challenge } from '../services/predictiveChallenges';
import { WorkoutSession } from '../types';

export function useChallenges(history: WorkoutSession[]) {
    const [challenges, setChallenges] = useLS<Challenge[]>('fit_challenges', []);

    // Atualiza lógica ou expira desafios
    useEffect(() => {
        const now = new Date().getTime();
        let changed = false;
        
        const updated = challenges.map(c => {
            if (c.status === 'active' && new Date(c.deadline).getTime() < now) {
                changed = true;
                return { ...c, status: 'failed' as const };
            }
            return c;
        });

        // Se tiver passado mtos dias ou nao houver, gerar um
        const activeCount = updated.filter(c => c.status === 'active').length;
        if (activeCount === 0 && history.length >= 3) { // Precisa de algum histórico
            const newCs = PredictiveChallenges.generateChallenges(history);
            if (newCs.length > 0) {
                updated.push(...newCs);
                changed = true;
            }
        }

        if (changed) setChallenges(updated);
    }, [history, challenges, setChallenges]);

    return { challenges, setChallenges };
}
