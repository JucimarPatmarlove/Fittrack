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
  
  // Actions
  loadNutritionData: (date: string) => Promise<void>;
  addMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', meal: MealItem) => Promise<void>;
  removeMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', mealId: string) => Promise<void>;
  updateHydration: (date: string, ml: number) => Promise<void>;
  addWeightLog: (date: string, weight: number) => Promise<void>;
  loadAllWeightLogs: () => Promise<void>;
}

const createEmptyMealLog = (date: string): DailyMealLog => ({
  date,
  breakfast: [],
  lunch: [],
  snack: [],
  dinner: []
});

export const useNutritionStore = create<NutritionState>((set, get) => ({
  currentMealLog: null,
  currentHydration: null,
  weightHistory: [],
  isLoading: false,

  loadNutritionData: async (date: string) => {
    set({ isLoading: true });
    try {
      const [mealLog, hydrationLog] = await Promise.all([
        getDailyMealLogDecrypted(date),
        getHydrationLogDecrypted(date)
      ]);
      
      set({ 
        currentMealLog: mealLog || createEmptyMealLog(date),
        currentHydration: hydrationLog || { date, mlConsumed: 0 },
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
    
    // Se a data alterada for a data atual no state, atualiza o state
    if (state.currentMealLog?.date === date) {
      set({ currentMealLog: updatedLog });
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
      set({ currentMealLog: updatedLog });
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
      set({ currentHydration: updatedLog });
    }
  },

  addWeightLog: async (date: string, weight: number) => {
    const newLog = { date, weight };
    await saveWeightLog(newLog);
    
    // Atualiza history e recarrega
    await get().loadAllWeightLogs();
  },

  loadAllWeightLogs: async () => {
    try {
      const logs = await getAllWeightLogsDecrypted();
      set({ weightHistory: logs.sort((a, b) => a.date.localeCompare(b.date)) });
    } catch (err) {
      console.error('[NutritionStore] Erro ao carregar histórico de peso:', err);
    }
  }
}));
