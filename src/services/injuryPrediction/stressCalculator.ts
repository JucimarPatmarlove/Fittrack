// src/services/injuryPrediction/stressCalculator.ts

import type { BodyRegion, MuscleGroup } from '../../types/injury';
import { calculateSetEffort } from '../../utils/xpCalculator';
import { EXERCISE_REGION_MAP } from './exerciseRegionMap';

// ── Input types for the stress calculator ────────────────────────────────────
// These mirror the runtime workout shape from useFitnessData / WorkoutSession.
// They are intentionally permissive to handle legacy data without breaking.

export interface SetEntry {
  type?: 'weighted' | 'bodyweight' | 'cardio' | 'timed' | 'mobility' | 'distance';
  weight?: number;
  reps?: number;
  rpe?: number;
  done?: boolean;
  addedWeight?: number;
  duration?: number; // seconds
  distance?: number; // km
}

export interface ExerciseEntry {
  name: string;
  muscle?: string;
  sets: SetEntry[];
}

export interface WorkoutHistoryEntry {
  date: string | number;
  exercises?: ExerciseEntry[];
  name?: string;
  durationSeconds?: number;
  totalVolumeKg?: number;
}

// Constantes do modelo
const ACUTE_WINDOW_DAYS = 7;
const CHRONIC_WINDOW_DAYS = 28;

export interface SessionStress {
  date: string;
  region: BodyRegion;
  muscle: MuscleGroup;
  stressValue: number;
}

/**
 * Calcula o stress de uma única série numa região específica
 */
export function calculateSetStress(
  set: SetEntry,
  exerciseName: string,
  userBodyweight = 75,
): { region: BodyRegion; muscle: MuscleGroup; stress: number }[] {
  const mapping = EXERCISE_REGION_MAP[exerciseName];
  if (!mapping) return [];

  // Base effort da série reutilizando o xpCalculator (já normaliza peso, tempo, repetições, etc.)
  const baseEffort = calculateSetEffort(set, userBodyweight);

  // Aplicar multiplicador do exercício e RPE
  const rpeMultiplier = set.rpe ? set.rpe / 5 : 1.6; // se RPE 8 -> 1.6x stress, RPE 10 -> 2x stress
  const stressPerUnit = baseEffort * mapping.stressMultiplier * rpeMultiplier;

  // Distribuir stress pelas regiões
  const results: { region: BodyRegion; muscle: MuscleGroup; stress: number }[] = [];

  mapping.primaryJoints.forEach((joint) => {
    mapping.primaryMuscles.forEach((muscle) => {
      results.push({
        region: joint,
        muscle,
        stress: stressPerUnit / mapping.primaryJoints.length,
      });
    });
  });

  return results;
}

/**
 * Calcula o stress total de uma sessão de treino
 */
export function calculateSessionStress(
  workout: WorkoutHistoryEntry,
  userBodyweight = 75,
): SessionStress[] {
  const stresses: SessionStress[] = [];

  if (!workout.exercises || !Array.isArray(workout.exercises)) return stresses;

  workout.exercises.forEach((exercise) => {
    if (exercise.sets && Array.isArray(exercise.sets)) {
      exercise.sets.forEach((set) => {
        const setStresses = calculateSetStress(set, exercise.name, userBodyweight);
        setStresses.forEach(({ region, muscle, stress }) => {
          stresses.push({
            date: new Date(workout.date).toISOString(),
            region,
            muscle,
            stressValue: stress,
          });
        });
      });
    }
  });

  return stresses;
}

/**
 * Calcula AC Ratio (Acute:Chronic Workload Ratio)
 */
export function calculateACRatio(
  history: WorkoutHistoryEntry[],
  region: BodyRegion,
  userBodyweight = 75,
  referenceDate: string = new Date().toISOString(),
): { acute: number; chronic: number; ratio: number } {
  const refDate = new Date(referenceDate);
  const acuteCutoff = new Date(refDate);
  acuteCutoff.setDate(acuteCutoff.getDate() - ACUTE_WINDOW_DAYS);

  const chronicCutoff = new Date(refDate);
  chronicCutoff.setDate(chronicCutoff.getDate() - CHRONIC_WINDOW_DAYS);

  // Extrair stress da região do histórico
  const regionStresses: { date: Date; stress: number }[] = [];

  history.forEach((workout) => {
    const workoutDate = new Date(workout.date);
    const sessionStresses = calculateSessionStress(workout, userBodyweight);

    sessionStresses
      .filter((s) => s.region === region)
      .forEach((s) => {
        regionStresses.push({ date: workoutDate, stress: s.stressValue });
      });
  });

  // Calcular cargas aguda e crónica
  const acuteLoad = regionStresses
    .filter((s) => s.date >= acuteCutoff && s.date <= refDate)
    .reduce((sum, s) => sum + s.stress, 0);

  const chronicLoad =
    regionStresses
      .filter((s) => s.date >= chronicCutoff && s.date <= refDate)
      .reduce((sum, s) => sum + s.stress, 0) / 4; // Média semanal

  const ratio = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

  return { acute: acuteLoad, chronic: chronicLoad, ratio };
}
