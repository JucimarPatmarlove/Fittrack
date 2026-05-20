import { useState, useEffect } from 'react';

export interface GhostSet {
    exerciseName: string;
    weight: number;
    reps: number;
    date: string;
}

export interface GhostState {
    ghostSet: GhostSet | null;
    isPR: boolean;
    celebrationTrigger: boolean;
}

/**
 * useGhostMode
 * Tracks the previous set for an exercise and detects Personal Records (PRs)
 * Enables the gamified "Ghost Sets" feature where the user sees their last performance
 */
export function useGhostMode(exerciseName: string, history: any[]) {
    const [ghostState, setGhostState] = useState<GhostState>({
        ghostSet: null,
        isPR: false,
        celebrationTrigger: false,
    });

    // Load the last set for this exercise from history
    useEffect(() => {
        const lastWorkout = history?.slice().reverse().find((w: any) => w.exercises?.some((e: any) => e.name === exerciseName));

        if (lastWorkout) {
            const exerciseData = lastWorkout.exercises?.find((e: any) => e.name === exerciseName);
            if (exerciseData?.sets?.length > 0) {
                const lastSet = exerciseData.sets[exerciseData.sets.length - 1];
                setGhostState({
                    ghostSet: {
                        exerciseName,
                        weight: lastSet.weight || 0,
                        reps: lastSet.reps || 0,
                        date: lastWorkout.date || new Date().toISOString().split('T')[0],
                    },
                    isPR: false,
                    celebrationTrigger: false,
                });
            }
        }
    }, [exerciseName, history]);

    /**
     * Check if the current set beats the ghost set (new PR)
     * Returns true if: same weight with more reps, or more weight with same/more reps
     */
    const checkForPR = (currentWeight: number, currentReps: number): boolean => {
        if (!ghostState.ghostSet) return currentReps > 0; // First ever set is a PR

        const { weight: ghostWeight, reps: ghostReps } = ghostState.ghostSet;

        // Better or equal weight with more reps
        if (currentWeight >= ghostWeight && currentReps > ghostReps) return true;

        // Strictly more weight (reps can be equal or less)
        if (currentWeight > ghostWeight) return true;

        return false;
    };

    const triggerCelebration = () => {
        setGhostState(prev => ({ ...prev, celebrationTrigger: true }));
        // Reset celebration trigger after animation
        setTimeout(() => {
            setGhostState(prev => ({ ...prev, celebrationTrigger: false }));
        }, 1500);
    };

    return {
        ghostState,
        checkForPR,
        triggerCelebration,
    };
}
