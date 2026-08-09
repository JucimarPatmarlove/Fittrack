// @ts-nocheck
import { WorkoutSession } from "../db/schema";;

export interface RivalState {
    found: boolean;
    rivalVolume: number;
    rivalDuration: number; // in seconds
    scorePerSecond: number; // metric to race against
    rivalWorkout?: WorkoutSession;
}

export const RivalAI = {
    // Procura o treino correspondente de há 7-14 dias atrás
    findRival(history: WorkoutSession[], todayPlanLabel: string): RivalState {
        const now = new Date().getTime();
        const minPast = 5 * 24 * 3600 * 1000; // Mínimo 5 dias atrás para ser um super "Rival"

        const pastWorkouts = [...history]
            .filter(w => w.dayLabel === todayPlanLabel && (now - new Date(w.date).getTime()) > minPast)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (pastWorkouts.length === 0) {
            return { found: false, rivalVolume: 0, rivalDuration: 0, scorePerSecond: 0 };
        }

        const rival = pastWorkouts[0];
        // Score = Total Volume / Duration. Defines "Intensity Speed"
        const scorePerSec = rival.duration > 0 ? (rival.totalVolume / rival.duration) : 0;

        return {
            found: true,
            rivalVolume: rival.totalVolume,
            rivalDuration: rival.duration,
            scorePerSecond: scorePerSec,
            rivalWorkout: rival
        };
    },

    // Retorna a posição do fantasma num determinado segundo da corrida
    getGhostProgress(rivalState: RivalState, elapsedSeconds: number): number {
        if (!rivalState.found || rivalState.rivalDuration <= 0) return 0;
        const progress = elapsedSeconds / rivalState.rivalDuration;
        return Math.min(1, progress); // Max 100%
    },
    
    // Retorna o progresso do user consoante o volume e o objetivo a bater
    getUserProgress(currentVolume: number, rivalState: RivalState): number {
        if (!rivalState.found || rivalState.rivalVolume <= 0) return 0;
        return Math.min(1, currentVolume / rivalState.rivalVolume);
    }
};
