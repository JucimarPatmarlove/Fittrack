import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEncryptedStorage } from './encryptedPersist';
import { GhostSetRecord, DailyGhostStats } from '../types/ghost';

interface GhostStore {
  active: boolean;
  currentGhost: GhostSetRecord | null;
  dailyStats: DailyGhostStats;
  xpInsuranceUsed: boolean;
  xpInsuranceWeeklyReset: string;
  toggleGhost: () => void;
  calculateGhostTarget: (exerciseId: string) => GhostSetRecord | null;
  registerAttempt: (exerciseId: string, weight: number, reps: number, success: boolean) => number;
  getDailyFailureUsed: () => boolean;
}

export const useGhostStore = create<GhostStore>()(
  persist(
    (set, get) => ({
      active: false,
      currentGhost: null,
      xpInsuranceUsed: false,
      xpInsuranceWeeklyReset: new Date().toISOString().split('T')[0],
      dailyStats: {
        date: new Date().toISOString().split('T')[0],
        attempts: 0,
        failures: 0,
        totalXPGained: 0,
      },
      
      toggleGhost: () => set((state) => ({ active: !state.active })),
      
      calculateGhostTarget: (exerciseId) => {
        const historyJSON = localStorage.getItem('fit_history');
        if (!historyJSON) return null;
        const mainHistory: WorkoutSession[] = JSON.parse(historyJSON) || [];
        
        let recentTotal = 0;
        let recentCount = 0;
        let bestRecord: { weight: number; reps: number } | null = null;
        let maxVolume = 0;
        
        const now = Date.now();
        const ninetyDaysMillis = 90 * 24 * 60 * 60 * 1000;

        mainHistory.forEach((session: WorkoutSession) => {
           const sets = session.sets[exerciseId];
           const sessionDate = new Date(session.date).getTime();
           if (sets && (now - sessionDate < ninetyDaysMillis)) {
               sets.forEach((serie: { done: boolean; reps: number; weight: number }) => {
                   if (serie.done && serie.reps && serie.weight) {
                       const vol = serie.reps * serie.weight;
                       recentTotal += vol;
                       recentCount++;
                       if (vol > maxVolume) {
                           maxVolume = vol;
                           bestRecord = serie;
                       }
                   }
               });
           }
        });

        if (!bestRecord) return null;
        
        const recentAvg = recentCount > 0 ? (recentTotal / recentCount) : maxVolume;
        
        // Ajuste automático caso volume seja irrealista para esta fase (>20% acima da média móvel)
        if (maxVolume > recentAvg * 1.2) {
             const adjustedMax = recentAvg * 1.1; // Ajusta fantasma para 10% superior à média móvel
             maxVolume = adjustedMax;
             bestRecord.reps = bestRecord.reps || 8;
             bestRecord.weight = Math.floor(adjustedMax / bestRecord.reps);
        }
        
        const generatedGhost = {
          id: crypto.randomUUID(),
          exerciseId,
          date: new Date().toISOString(),
          bestVolume: maxVolume,
          bestWeight: bestRecord.weight,
          bestReps: bestRecord.reps,
          defeated: false,
          xpGained: 0,
        };

        set({ currentGhost: generatedGhost });
        return generatedGhost;
      },
      
      registerAttempt: (exerciseId, weight, reps, success) => {
        const today = new Date().toISOString().split('T')[0];
        const { dailyStats, xpInsuranceWeeklyReset, xpInsuranceUsed } = get();
        
        // Check weekly reset for insurance (Monday)
        const d = new Date();
        const isMonday = d.getDay() === 1;
        if (isMonday && xpInsuranceWeeklyReset !== today) {
            set({ xpInsuranceUsed: false, xpInsuranceWeeklyReset: today });
        }

        if (dailyStats.date !== today) {
          // Reset diário do limite de falhas
          set({
            dailyStats: {
              date: today,
              attempts: 0,
              failures: 0,
              totalXPGained: 0,
            }
          });
        }
        
        const volume = weight * reps;
        const ghost = get().currentGhost || get().calculateGhostTarget(exerciseId);
        if (!ghost) return 0;
        
        // Regra de success
        const isGhostDefeated = success && volume >= ghost.bestVolume;

        let xp = 0;
        if (isGhostDefeated) {
          xp = 250;
          const badges = JSON.parse(localStorage.getItem('badges') || '[]');
          if (!badges.includes('GHOST_SLAYER')) {
            badges.push('GHOST_SLAYER');
            localStorage.setItem('badges', JSON.stringify(badges));
          }
        } else if (!success) {
          if (!get().xpInsuranceUsed) {
               xp = 0; // Protegido!
               set({ xpInsuranceUsed: true });
               alert("⚠️ Ghost Set Falhado - O XP Insurance cobriu as tuas perdas!");
          } else {
               xp = -Math.floor(250 * 0.1); // -25 XP
          }
        }
        
        set((state) => ({
          dailyStats: {
            ...state.dailyStats,
            attempts: state.dailyStats.attempts + 1,
            failures: state.dailyStats.failures + (isGhostDefeated ? 0 : 1),
            totalXPGained: state.dailyStats.totalXPGained + xp,
          }
        }));
        
        return xp;
      },
      
      getDailyFailureUsed: () => {
        const stats = get().dailyStats;
        return stats.failures >= 1;
      },
    }),
    {
      name: 'ghost-store',
      storage: createEncryptedStorage(),
    }
  )
);
