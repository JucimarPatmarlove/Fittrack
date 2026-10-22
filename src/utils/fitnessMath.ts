export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps < 1) return 0;
  const oneRM = weight * (1 + reps / 30);
  return Math.round(oneRM * 10) / 10;
}

import {
  getAllWorkouts,
  getSetLogsByWorkout,
} from '../db/schema';

/**
 * Export all workouts from IndexedDB to CSV format.
 *
 * CSV columns: Data, Nome do Treino, Exercício, Série, Peso (kg), Reps, Volume Total, Duração
 *
 * @returns A data URI that can be used for download
 */
export async function exportWorkoutsToCSV(): Promise<string> {
  const workouts = await getAllWorkouts();

  // Get all set logs from all workouts
  const allSetLogs: any[] = [];

  for (const workout of workouts) {
    const setLogs = await getSetLogsByWorkout(workout.id);
    allSetLogs.push(...setLogs);
  }

  // Build CSV
  const rows: string[] = [];

  // Header row
  rows.push('Data,Nome do Treino,Exercício,Série,Peso (kg),Reps,Volume Total,Duração');

  // Group set logs by workout
  const workoutSetLogs: Map<string, any[]> = new Map();

  for (const log of allSetLogs) {
    if (!workoutSetLogs.has(log.workoutId)) {
      workoutSetLogs.set(log.workoutId, []);
    }
    workoutSetLogs.get(log.workoutId)!.push(log);
  }

  // Sort workouts by date (newest first)
  const sortedWorkouts: any[] = [...workouts].sort(
    (a, b) => b.date - a.date
  );

  for (const workout of sortedWorkouts) {
    const logs = workoutSetLogs.get(workout.id) || [];

    for (const log of logs) {
      // Calculate volume for this set (weight * reps)
      const volume = log.weightKg * log.repsCompleted;

      // Format date
      const date = new Date(workout.date);
      const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

      rows.push(
        `${dateStr},${workout.name},${log.exerciseName},${log.setNumber},${log.weightKg},${log.repsCompleted},${volume},${workout.durationSeconds}`
      );
    }
  }

  // Create data URI for download
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dataUri = URL.createObjectURL(blob);

  return dataUri;
}