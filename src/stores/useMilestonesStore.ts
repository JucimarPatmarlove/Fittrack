import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MilestonesState {
  prs: Record<string, number>;
  milestones: Record<string, number>; // id -> timestamp
  setPR: (exerciseName: string, weight: number) => void;
  getPR: (exerciseName: string) => number;
  unlockMilestone: (id: string) => void;
}

export const useMilestonesStore = create<MilestonesState>()(
  persist(
    (set, get) => ({
      prs: {},
      milestones: {},
      setPR: (exerciseName, weight) => set((state) => ({
        prs: { ...state.prs, [exerciseName]: weight }
      })),
      getPR: (exerciseName) => get().prs[exerciseName] || 0,
      unlockMilestone: (id) => {
        if (!get().milestones[id]) {
          set((state) => ({
            milestones: { ...state.milestones, [id]: Date.now() }
          }));
        }
      }
    }),
    {
      name: 'ft_milestones'
    }
  )
);

export function calculateStreak(history: any[]): number {
  if (!history || history.length === 0) return 0;
  
  const dates = history.map(w => new Date(w.date).toISOString().split('T')[0]);
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (uniqueDates.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  
  // check if there's a workout today or yesterday
  const todayStr = currentDate.toISOString().split('T')[0];
  const yesterdayStr = new Date(currentDate.getTime() - 86400000).toISOString().split('T')[0];
  
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0; // broken streak
  }
  
  let checkDate = new Date(uniqueDates[0]);
  for (let i = 0; i < uniqueDates.length; i++) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (uniqueDates[i] === dStr) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }
  
  return streak;
}
