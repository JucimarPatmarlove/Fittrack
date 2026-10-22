// src/utils/workoutAdapters.ts
import { WorkoutSession } from '../db/schema';
import { WorkoutSessionData } from './schemas';

export const toWorkoutData = (session: WorkoutSession): WorkoutSessionData => ({
  date: new Date(session.date).toISOString().split('T')[0] ?? '',
  dayLabel: session.name || '',
  duration: session.durationSeconds,
  totalVolume: session.totalVolumeKg,
  exercises: [],
});

export const toWorkoutSession = (data: WorkoutSessionData & { id?: string }): WorkoutSession => ({
  id: data.id || crypto.randomUUID(),
  date: new Date(data.date).getTime() || Date.now(),
  name: data.dayLabel || 'Treino',
  durationSeconds: data.duration,
  totalVolumeKg: data.totalVolume || 0,
  readinessScore: 85,
  isCompleted: true,
});
