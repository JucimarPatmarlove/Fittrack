import type { WorkoutSession } from '../db/schema';
// @ts-nocheck
import type { UserProfile } from '../types';

// 1. Cálculo de 1RM (Fórmula de Brzycki)
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 0) return 0;
  return Math.round(weight * (36 / (37 - reps)));
}

// 2. Cálculo de Calorias (MET 6 para musculação)
export function estimateCaloriesBurned(workout: WorkoutSession, profile: UserProfile): number {
  const MET = 6;
  const hours = workout.duration / 3600; // Assumindo que a duração está em segundos
  return Math.round(MET * profile.weight * hours);
}

// 3. Calculadora de Aquecimento
export interface WarmupSet {
  weight: number;
  reps: number;
  isWarmup: boolean;
}

export function getWarmupSets(workingWeight: number): WarmupSet[] {
  const percentages = [0.5, 0.6, 0.7, 0.8];
  return percentages.map((pct) => ({
    weight: Math.round((workingWeight * pct) / 2.5) * 2.5,
    reps: pct < 0.7 ? 5 : 3,
    isWarmup: true,
  }));
}

// 4. Sistema de Recuperação Muscular
export interface MuscleRecovery {
  muscle: string;
  lastTrained: Date | null;
  recoveryPercentage: number;
}

export function calculateRecovery(history: WorkoutSession[]): MuscleRecovery[] {
  const now = new Date();
  const muscles = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Core'];

  return muscles.map((muscle) => {
    // Procura o último treino deste músculo
    const lastWorkout = history
      .filter((w) => w.exercises.some((e) => e.muscle === muscle))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    // Calcula os dias passados (se nunca treinou, assume 7 dias = 100% recuperado)
    const daysSince = lastWorkout
      ? (now.getTime() - new Date(lastWorkout.date).getTime()) / (1000 * 3600 * 24)
      : 7;

    return {
      muscle,
      lastTrained: lastWorkout ? new Date(lastWorkout.date) : null,
      recoveryPercentage: Math.min(100, Math.round((daysSince / 3) * 100)), // 3 dias para 100% de recuperação
    };
  });
}
