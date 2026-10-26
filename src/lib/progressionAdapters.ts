// Adaptadores para ligar o histórico do FitTrack ao motor de progressão
// Converte WorkoutSessionData (schema.ts) → Session (progression.ts)

import type { WorkoutSessionData } from '../utils/schemas';
import type { Session, ExerciseConfig, WorkoutSet } from './progression';

/**
 * Converte um WorkoutSessionData do histórico para uma Session do motor de progressão
 */
export function workoutSessionToSession(
  workout: WorkoutSessionData,
  exerciseName: string,
  config: ExerciseConfig
): Session | null {
  const exercise = workout.exercises?.find(e => e.name === exerciseName);
  if (!exercise || !exercise.sets?.length) return null;

  const sets: WorkoutSet[] = exercise.sets.map((set) => {
    const isWeighted = set.type === 'weighted';
    const isBodyweight = set.type === 'bodyweight';
    const isRepsBased = isWeighted || isBodyweight;

    return {
      weight: isWeighted ? (set.weight ?? 0) : (isBodyweight ? (set.addedWeight ?? 0) : 0),
      targetReps: isRepsBased ? (set.reps ?? config.reps) : 0,
      completedReps: isRepsBased ? (set.reps ?? 0) : 0,
      done: set.done ?? false,
      isWarmup: set.isWarmup ?? false,
    };
  });

  return {
    id: `workout-${workout.date}-${exerciseName}`,
    date: workout.date,
    exerciseId: exerciseName,
    sets,
    config,
  };
}

/**
 * Extrai todas as sessões passadas de um exercício específico do histórico
 * Ordenadas da mais antiga para a mais recente
 */
export function getExerciseSessions(
  history: WorkoutSessionData[],
  exerciseName: string,
  config: ExerciseConfig
): Session[] {
  return history
    .map(w => workoutSessionToSession(w, exerciseName, config))
    .filter((s): s is Session => s !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Cria a configuração padrão para um exercício baseada no plano atual
 */
export function createExerciseConfig(
  exerciseName: string,
  todayPlan: any
): ExerciseConfig {
  // Tenta obter o exercício do plano de hoje para configs específicas
  const planExercise = todayPlan?.exercises?.find?.((e: any) =>
    typeof e === 'string' ? e === exerciseName : e.name === exerciseName
  );

  const defaultSets = 3;
  const defaultReps = 12;
  const defaultRepsMin = 8;
  const defaultIncrement = 2.5;

  return {
    exerciseId: exerciseName,
    sets: planExercise?.sets ?? defaultSets,
    reps: planExercise?.reps ?? defaultReps,
    repsMin: planExercise?.repsMin ?? defaultRepsMin,
    weightIncrement: planExercise?.weightIncrement ?? defaultIncrement,
    isBodyweight: planExercise?.type === 'bodyweight' || false,
    currentWeight: planExercise?.weight ?? 0,
  };
}