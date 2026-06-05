import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEncryptedStorage } from './encryptedPersist';

interface EffortSession {
  id: string;
  timestamp: number;
  rpe: number; // 1-10 Rate of Perceived Exertion
  durationMinutes: number;
  pointsEarned: number;
}

interface EffortState {
  totalEffortPoints: number;
  fitTokens: number;
  readinessScore: number; // 0-100
  sessions: EffortSession[];
  addEffort: (rpe: number, durationMinutes: number) => void;
  convertEffortToTokens: () => void;
  updateReadinessScore: (score: number) => void;
  getTotalEffortLastWeek: () => number;
}

export const useEffortStore = create<EffortState>()(
  persist(
    (set, get) => ({
      totalEffortPoints: 0,
      fitTokens: 0,
      readinessScore: 85, // Default readiness
      sessions: [],
      
      addEffort: (rpe, durationMinutes) => {
        // Simple formula: RPE (1-10) * duration in minutes = points
        // Example: RPE 8 * 45 mins = 360 points
        const pointsEarned = rpe * durationMinutes;
        
        const newSession: EffortSession = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          rpe,
          durationMinutes,
          pointsEarned
        };

        set((state) => ({
          totalEffortPoints: state.totalEffortPoints + pointsEarned,
          sessions: [newSession, ...state.sessions].slice(0, 50) // Keep last 50
        }));
      },
      
      convertEffortToTokens: () => {
        set((state) => {
          // Conversion rate: 1000 points = 1 $FIT token
          const tokensToMint = Math.floor(state.totalEffortPoints / 1000);
          const remainingPoints = state.totalEffortPoints % 1000;
          
          if (tokensToMint > 0) {
            return {
              fitTokens: state.fitTokens + tokensToMint,
              totalEffortPoints: remainingPoints
            };
          }
          return state;
        });
      },
      
      updateReadinessScore: (score) => {
        set({ readinessScore: Math.max(0, Math.min(100, score)) });
      },
      
      getTotalEffortLastWeek: () => {
        const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
        const lastWeekEntries = get().sessions.filter(e => e.timestamp > oneWeekAgo);
        return lastWeekEntries.reduce((sum, e) => sum + e.pointsEarned, 0);
      }
    }),
    {
      name: 'effort-store',
      storage: createEncryptedStorage()
    }
  )
);
