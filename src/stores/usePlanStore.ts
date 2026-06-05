import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEncryptedStorage } from './encryptedPersist';

export type PlanType = 'hipertrofia' | 'forca' | 'anatoly' | 'fullbody' | 'calistenia';

export interface GeneratedPlan {
  id: string;
  name: string;
  type: PlanType;
  description: string;
  workouts: {
    day: string;
    focus: string;
    exercises: string[];
  }[];
  createdAt: number;
}

interface PlanState {
  currentPlan: GeneratedPlan | null;
  history: GeneratedPlan[];
  setCurrentPlan: (plan: GeneratedPlan) => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      history: [],
      
      setCurrentPlan: (plan) => set({ 
          currentPlan: plan, 
          history: [...get().history, plan].slice(-10) 
      })
    }),
    {
      name: 'plan-store',
      storage: createEncryptedStorage()
    }
  )
);
