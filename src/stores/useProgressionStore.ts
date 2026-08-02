import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEncryptedStorage } from './encryptedPersist';

interface ExerciseProgress {
  consecutiveSuccesses: number;          // séries bem sucedidas seguidas
  lastWeight: number;
  lastReps: number;
  suggestedIncrease: boolean;
  deloadSuggested: boolean;
}

interface ExerciseHistory {
  exerciseId: string;
  date: string;
  sets: { weight: number; reps: number; completed: boolean }[];
  targetReps: number;
  allSetsCompleted: boolean;
}

interface ProgressionStore {
  history: ExerciseHistory[];
  exercises: Record<string, ExerciseProgress>;
  getRecommendedReps: (exerciseId: string, currentTargetReps: number) => number;
  recordSession: (exerciseId: string, sets: { reps: number; weight: number; rpe?: number }[], targetReps: number) => void;
  recordSuccess: (exerciseName: string, repsDone: number, repsTarget: number, rpe: number) => void;
  recordFailure: (exerciseName: string) => void;
  shouldIncrease: (exerciseName: string) => boolean;
  shouldDeload: (exerciseName: string) => boolean;
}

export const useProgressionStore = create<ProgressionStore>()(
  persist(
    (set, get) => ({
      history: [],
      exercises: {},

      getRecommendedReps: (exerciseId, currentTargetReps) => {
        const { history } = get();
        const exerciseHistory = history
          .filter(h => h.exerciseId === exerciseId)
          .slice(-3);

        if (exerciseHistory.length === 0) return currentTargetReps;

        const lastTwoSessions = exerciseHistory.slice(-2);
        const allSuccessful = lastTwoSessions.every(session => session.allSetsCompleted);

        if (allSuccessful && lastTwoSessions.length === 2 && currentTargetReps < 20) {
          return Math.min(currentTargetReps + 2, 20);
        }

        const lastSession = exerciseHistory[exerciseHistory.length - 1];
        if (!lastSession.allSetsCompleted && currentTargetReps > 4) {
          return currentTargetReps - 1;
        }

        return currentTargetReps;
      },

      recordSession: (exerciseId, sets, targetReps) => {
        const allSetsCompleted = sets.every(set => set.completed && set.reps >= targetReps);
        
        const newHistory: ExerciseHistory = {
          exerciseId,
          date: new Date().toISOString(),
          sets: sets.map(s => ({ weight: s.weight, reps: s.reps, completed: s.completed })),
          targetReps,
          allSetsCompleted,
        };

        set(state => ({
          history: [...state.history, newHistory].slice(-50),
        }));
      },

      recordSuccess: (name, repsDone, repsTarget, rpe) => {
        const prev = get().exercises[name] || { consecutiveSuccesses: 0, lastWeight: 0, lastReps: 0, suggestedIncrease: false, deloadSuggested: false };
        const successRate = repsDone / repsTarget;
        const isHighQuality = successRate >= 0.9 && rpe <= 7;
        const newSuccesses = isHighQuality ? prev.consecutiveSuccesses + 1 : 0;
        const increase = newSuccesses >= 3;
        set((state) => ({
          exercises: {
            ...state.exercises,
            [name]: {
              ...prev,
              consecutiveSuccesses: newSuccesses,
              suggestedIncrease: increase,
              lastWeight: prev.lastWeight,
              lastReps: repsDone,
              deloadSuggested: false,
            }
          }
        }));
      },

      recordFailure: (name) => {
        const prev = get().exercises[name] || { consecutiveSuccesses: 0, lastWeight: 0, lastReps: 0, suggestedIncrease: false, deloadSuggested: false };
        const failures = (prev.consecutiveSuccesses < 0 ? prev.consecutiveSuccesses : 0) - 1;
        const deload = failures <= -2;
        set((state) => ({
          exercises: {
            ...state.exercises,
            [name]: {
              ...prev,
              consecutiveSuccesses: failures,
              suggestedIncrease: false,
              deloadSuggested: deload,
            }
          }
        }));
      },

      shouldIncrease: (name) => get().exercises[name]?.suggestedIncrease || false,
      shouldDeload: (name) => get().exercises[name]?.deloadSuggested || false,
    }),
    { 
      name: 'progression-store',
      storage: createEncryptedStorage() 
    }
  )
);
