// src/types/fitness.ts
import { WorkoutSession } from '../db/schema';
import { ExerciseDefinition } from './exercise';

export interface UnifiedExercise extends ExerciseDefinition {
  name: string;
  sets: Array<{
    type?: string;
    reps: number;
    weight?: number;
    rpe?: number;
    [key: string]: any; // Apenas propriedades extras, mas exercises em si não é any[]
  }>;
}

export interface UnifiedWorkoutSession extends WorkoutSession {
  exercises?: UnifiedExercise[];
  feedback?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    notes?: string;
  };
}
