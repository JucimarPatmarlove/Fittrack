// @ts-nocheck
// ============================================================
// FitTrack V7 — useProactiveCoach Hook
// ============================================================
// src/hooks/useProactiveCoach.ts
// ============================================================

import { useEffect, useCallback } from 'react';
import { useProactiveCoachStore } from '../stores/useProactiveCoachStore';
import { useInjuryStore } from '../stores/useInjuryStore';
import type { TriggerContext } from '../services/aiCoach/proactiveEngine';
import type { UserProfile } from '../types';
import type { WorkoutSession } from '../db/schema';

export function useProactiveCoach(profile: UserProfile | null, history: WorkoutSession[]) {
  const evaluate = useProactiveCoachStore((s) => s.evaluate);
  const lastReport = useInjuryStore((s) => s.lastReport);
  const recoveryData = useInjuryStore((s) => s.recoveryData);

  const runEvaluation = useCallback(() => {
    if (!profile) return;

    const lastWorkout = history[history.length - 1] || null;
    const now = new Date();
    const lastWorkoutDate = lastWorkout ? new Date(lastWorkout.date) : null;
    const daysSinceLastWorkout = lastWorkoutDate
      ? Math.floor((now.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Calcular streak (simplificado)
    let streakDays = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const workoutDate = new Date(history[i].date);
      const daysDiff = Math.floor((now.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= streakDays + 1) {
        streakDays = daysDiff + 1;
      } else {
        break;
      }
    }

    const context: TriggerContext = {
      injuryReport: lastReport,
      recoveryData: recoveryData as any,
      lastWorkout,
      workoutHistory: history,
      streakDays,
      daysSinceLastWorkout,
      userBodyweight: profile.weight || 75,
      userGoals: profile.goals || [],
    };

    evaluate(context);
  }, [lastReport, recoveryData, history, profile, evaluate]);

  // Avaliar quando o injury report muda
  useEffect(() => {
    runEvaluation();
  }, [lastReport, runEvaluation]);

  // Avaliar diariamente (manhã)
  useEffect(() => {
    const checkMorning = () => {
      const hour = new Date().getHours();
      if (hour === 8) {
        runEvaluation();
      }
    };

    const interval = setInterval(checkMorning, 60 * 60 * 1000); // Check a cada hora
    return () => clearInterval(interval);
  }, [runEvaluation]);

  return { runEvaluation };
}
