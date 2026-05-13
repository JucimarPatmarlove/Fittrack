import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyChecklist {
    date: string;
    meals: {
      breakfast: boolean;
      morningSnack: boolean;
      lunch: boolean;
      afternoonSnack: boolean;
      dinner: boolean;
    };
    completed: boolean;
  }
  
  export interface Challenge90Data {
    startDate: string | null;
    currentDay: number;
    dailyChecklists: DailyChecklist[];
    currentStreak: number;
    longestStreak: number;
  }

interface ChallengeStore extends Challenge90Data {
  startChallenge: () => void;
  toggleMeal: (meal: keyof DailyChecklist['meals']) => void;
  getTodayChecklist: () => DailyChecklist | null;
  getCompletionRate: () => number;
}

const MEAL_ORDER = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner'];

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      startDate: null,
      currentDay: 0,
      dailyChecklists: [],
      currentStreak: 0,
      longestStreak: 0,

      startChallenge: () => {
        const today = new Date().toISOString().split('T')[0];
        set({
          startDate: today,
          currentDay: 1,
          dailyChecklists: [{
            date: today,
            meals: {
              breakfast: false,
              morningSnack: false,
              lunch: false,
              afternoonSnack: false,
              dinner: false,
            },
            completed: false,
          }],
          currentStreak: 0,
          longestStreak: 0,
        });
      },

      toggleMeal: (meal) => {
        const { dailyChecklists, currentStreak, longestStreak } = get();
        const today = new Date().toISOString().split('T')[0];
        let todayChecklist = dailyChecklists.find(c => c.date === today);
        
        if (!todayChecklist) {
          todayChecklist = {
            date: today,
            meals: {
              breakfast: false,
              morningSnack: false,
              lunch: false,
              afternoonSnack: false,
              dinner: false,
            },
            completed: false,
          };
          dailyChecklists.push(todayChecklist);
        }
        
        todayChecklist.meals[meal] = !todayChecklist.meals[meal];
        
        const allCompleted = MEAL_ORDER.every(m => todayChecklist!.meals[m as keyof typeof todayChecklist.meals]);
        todayChecklist.completed = allCompleted;
        
        let newStreak = currentStreak;
        if (allCompleted) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const yesterdayChecklist = dailyChecklists.find(c => c.date === yesterday);
          if (yesterdayChecklist?.completed) {
            newStreak++;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 0;
        }
        
        set({
          dailyChecklists: [...dailyChecklists],
          currentStreak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
        });
      },

      getTodayChecklist: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().dailyChecklists.find(c => c.date === today) || null;
      },

      getCompletionRate: () => {
        const { dailyChecklists } = get();
        const completed = dailyChecklists.filter(c => c.completed).length;
        return dailyChecklists.length ? (completed / dailyChecklists.length) * 100 : 0;
      },
    }),
    { name: 'challenge-90-storage' }
  )
);
