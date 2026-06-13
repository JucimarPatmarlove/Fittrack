import { create } from 'zustand';
import { DailyMealLog, HydrationLog, WeightLog, MealItem } from '../db/schema';
import { 
  getDailyMealLogDecrypted, 
  saveDailyMealLog, 
  getHydrationLogDecrypted, 
  saveHydrationLog, 
  getWeightLogDecrypted, 
  saveWeightLog,
  getAllWeightLogsDecrypted
} from '../db/encryptedDb';

interface NutritionState {
  currentMealLog: DailyMealLog | null;
  currentHydration: HydrationLog | null;
  weightHistory: WeightLog[];
  isLoading: boolean;
  
  // Novas propriedades pedidas pelo Dashboard
  profile: any;
  meals: DailyMealLog[];
  hydration: HydrationLog[];
  currentDate: string;
  
  // Actions
  loadNutritionData: (date: string) => Promise<void>;
  addMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', meal: MealItem) => Promise<void>;
  removeMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', mealId: string) => Promise<void>;
  updateHydration: (date: string, ml: number) => Promise<void>;
  addWeightLog: (date: string, weight: number) => Promise<void>;
  loadAllWeightLogs: () => Promise<void>;
  
  // Aliases e Novas Actions pedidas pelo Dashboard
  setCurrentDate: (date: string) => void;
  setWeight: (weight: number) => Promise<void>;
  addWater: (amountMl: number) => Promise<void>;
}

const createEmptyMealLog = (date: string): DailyMealLog => ({
  date,
  breakfast: [],
  lunch: [],
  snack: [],
  dinner: []
});

const getProfileSafe = () => {
  try {
    const p = JSON.parse(localStorage.getItem('fittrack_profile') || '{}');
    return {
      weight: 75, height: 175, age: 30, gender: "male",
      goal: "maintain", activityLevel: "moderate",
      targetCalories: 2300, targetProtein: 140, targetCarb: 270, targetFat: 68,
      ...p
    };
  } catch(e) {
    return { weight: 75, targetCalories: 2300, targetProtein: 140, targetCarb: 270, targetFat: 68 };
  }
};

export const useNutritionStore = create<NutritionState>((set, get) => ({
  currentMealLog: null,
  currentHydration: null,
  weightHistory: [],
  isLoading: false,
  
  profile: getProfileSafe(),
  meals: [],
  hydration: [],
  currentDate: new Date().toISOString().split('T')[0],

  setCurrentDate: (date: string) => set({ currentDate: date }),

  loadNutritionData: async (date: string) => {
    set({ isLoading: true });
    try {
      const [mealLog, hydrationLog] = await Promise.all([
        getDailyMealLogDecrypted(date),
        getHydrationLogDecrypted(date)
      ]);
      
      const loadedMeal = mealLog || createEmptyMealLog(date);
      const loadedHydration = hydrationLog || { date, mlConsumed: 0 };
      
      set({ 
        currentMealLog: loadedMeal,
        currentHydration: loadedHydration,
        meals: [loadedMeal],
        hydration: [loadedHydration],
        isLoading: false
      });
    } catch (err) {
      console.error('[NutritionStore] Erro ao carregar dados:', err);
      set({ isLoading: false });
    }
  },

  addMeal: async (date: string, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', meal: MealItem) => {
    const state = get();
    let mealLog = state.currentMealLog;
    
    if (!mealLog || mealLog.date !== date) {
      mealLog = await getDailyMealLogDecrypted(date) || createEmptyMealLog(date);
    }
    
    const updatedLog = {
      ...mealLog,
      [mealType]: [...mealLog[mealType], meal]
    };
    
    await saveDailyMealLog(updatedLog);
    
    if (state.currentMealLog?.date === date) {
      set({ currentMealLog: updatedLog, meals: [updatedLog] });
    }
  },

  removeMeal: async (date: string, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', mealId: string) => {
    const state = get();
    let mealLog = state.currentMealLog;
    
    if (!mealLog || mealLog.date !== date) {
      mealLog = await getDailyMealLogDecrypted(date) || createEmptyMealLog(date);
    }
    
    const updatedLog = {
      ...mealLog,
      [mealType]: mealLog[mealType].filter((m: MealItem) => m.id !== mealId)
    };
    
    await saveDailyMealLog(updatedLog);
    
    if (state.currentMealLog?.date === date) {
      set({ currentMealLog: updatedLog, meals: [updatedLog] });
    }
  },

  updateHydration: async (date: string, ml: number) => {
    const state = get();
    let hydrationLog = state.currentHydration;
    
    if (!hydrationLog || hydrationLog.date !== date) {
      hydrationLog = await getHydrationLogDecrypted(date) || { date, mlConsumed: 0 };
    }
    
    const updatedLog = {
      ...hydrationLog,
      mlConsumed: hydrationLog.mlConsumed + ml
    };
    
    await saveHydrationLog(updatedLog);
    
    if (state.currentHydration?.date === date) {
      set({ currentHydration: updatedLog, hydration: [updatedLog] });
    }
  },

  addWeightLog: async (date: string, weight: number) => {
    const newLog = { date, weight };
    await saveWeightLog(newLog);
    await get().loadAllWeightLogs();
  },

  loadAllWeightLogs: async () => {
    try {
      const logs = await getAllWeightLogsDecrypted();
      set({ weightHistory: logs.sort((a, b) => a.date.localeCompare(b.date)) });
    } catch (err) {
      console.error('[NutritionStore] Erro ao carregar histórico:', err);
    }
  },

  // Aliases para o Dashboard
  addWater: async (amountMl: number) => {
    await get().updateHydration(get().currentDate, amountMl);
  },

  setWeight: async (weight: number) => {
    const currentProfile = get().profile;
    const updatedProfile = { ...currentProfile, weight };
    localStorage.setItem('fittrack_profile', JSON.stringify(updatedProfile));
    set({ profile: updatedProfile });
    
    await get().addWeightLog(get().currentDate, weight);
  }
}));
