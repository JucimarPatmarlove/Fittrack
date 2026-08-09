// src/stores/useInjuryStore.ts

import { create } from 'zustand';
import { runInjuryPrediction } from '../services/injuryPrediction';
import type { WorkoutPlan } from '../types';
import type { InjuryRiskReport, RecoveryInput } from '../types/injury';

interface InjuryState {
  // Dados
  lastReport: InjuryRiskReport | null;
  recoveryData: RecoveryInput | null;

  // UI State
  showPanel: boolean;
  dismissedWarnings: string[]; // IDs de warnings que o user dismissou

  // Ações
  generateReport: (
    history: any[],
    bodyweight: number,
    plannedWorkout?: WorkoutPlan,
  ) => InjuryRiskReport;
  setRecoveryData: (data: RecoveryInput) => void;
  togglePanel: () => void;
  dismissWarning: (warningId: string) => void;
  clearDismissed: () => void;
}

export const useInjuryStore = create<InjuryState>((set, get) => ({
  lastReport: null,
  recoveryData: null,
  showPanel: true,
  dismissedWarnings: [],

  generateReport: (history, bodyweight, plannedWorkout) => {
    const { recoveryData } = get();
    const report = runInjuryPrediction({
      workoutHistory: history,
      userBodyweight: bodyweight,
      plannedWorkout,
      recoveryData: recoveryData || undefined,
    });
    set({ lastReport: report });
    return report;
  },

  setRecoveryData: (data) => set({ recoveryData: data }),

  togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),

  dismissWarning: (warningId) =>
    set((state) => ({
      dismissedWarnings: [...state.dismissedWarnings, warningId],
    })),

  clearDismissed: () => set({ dismissedWarnings: [] }),
}));
