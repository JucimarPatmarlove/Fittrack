// src/services/injuryPrediction/exerciseRegionMap.ts

import type { BodyRegion, MuscleGroup } from '../../types/injury';

export interface ExerciseRegionMapping {
  primaryMuscles: MuscleGroup[];
  primaryJoints: BodyRegion[];
  stressMultiplier: number; // 1.0 é normal, >1.0 mais agressivo
}

export const EXERCISE_REGION_MAP: Record<string, ExerciseRegionMapping> = {
  // Peito
  'Barbell Bench Press': {
    primaryMuscles: ['peito', 'triceps', 'ombros'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 1.2,
  },
  'Barbell Incline Bench Press': {
    primaryMuscles: ['peito', 'ombros'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 1.3,
  },
  'Dumbbell Bench Press': {
    primaryMuscles: ['peito', 'triceps'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 1.1,
  },
  'Dumbbell Incline Bench Press': {
    primaryMuscles: ['peito', 'ombros'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 1.2,
  },
  'Push-Up': {
    primaryMuscles: ['peito', 'triceps', 'core'],
    primaryJoints: [
      'ombro_direito',
      'ombro_esquerdo',
      'cotovelo_direito',
      'cotovelo_esquerdo',
      'punho_direito',
      'punho_esquerdo',
    ],
    stressMultiplier: 1.0,
  },
  Dips: {
    primaryMuscles: ['triceps', 'peito', 'ombros'],
    primaryJoints: [
      'ombro_direito',
      'ombro_esquerdo',
      'cotovelo_direito',
      'cotovelo_esquerdo',
      'punho_direito',
      'punho_esquerdo',
    ],
    stressMultiplier: 1.4, // Grande stress articular no ombro/cotovelo
  },

  // Costas
  'Barbell Bent Over Row': {
    primaryMuscles: ['costas', 'biceps', 'core'],
    primaryJoints: [
      'ombro_direito',
      'ombro_esquerdo',
      'coluna_lombar',
      'cotovelo_direito',
      'cotovelo_esquerdo',
    ],
    stressMultiplier: 1.3, // Requer muita estabilização lombar
  },
  'Barbell Deadlift': {
    primaryMuscles: ['costas', 'gluteos', 'isquiotibiais', 'core'],
    primaryJoints: [
      'coluna_lombar',
      'anca_direita',
      'anca_esquerda',
      'joelho_direito',
      'joelho_esquerdo',
    ],
    stressMultiplier: 1.5, // Altíssimo stress neural e lombar
  },
  'Pull-Up': {
    primaryMuscles: ['costas', 'biceps'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 1.1,
  },
  'Chin-Up': {
    primaryMuscles: ['costas', 'biceps'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 1.1,
  },
  'Cable Lat Pull Down Wide-Grip': {
    primaryMuscles: ['costas', 'biceps'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 0.9,
  },

  // Ombros
  'Barbell Overhead Press': {
    primaryMuscles: ['ombros', 'triceps'],
    primaryJoints: [
      'ombro_direito',
      'ombro_esquerdo',
      'cotovelo_direito',
      'cotovelo_esquerdo',
      'coluna_cervical',
    ],
    stressMultiplier: 1.4,
  },
  'Dumbbell Shoulder Press': {
    primaryMuscles: ['ombros', 'triceps'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 1.2,
  },
  'Dumbbell Lateral Raise': {
    primaryMuscles: ['ombros'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo'],
    stressMultiplier: 1.0,
  },

  // Braços
  'Barbell Bicep Curl': {
    primaryMuscles: ['biceps'],
    primaryJoints: ['cotovelo_direito', 'cotovelo_esquerdo', 'punho_direito', 'punho_esquerdo'],
    stressMultiplier: 1.0,
  },
  'Cable Rope Tricep Pushdown': {
    primaryMuscles: ['triceps'],
    primaryJoints: ['cotovelo_direito', 'cotovelo_esquerdo'],
    stressMultiplier: 0.8, // Menor stress articular por ser cabo
  },

  // Pernas
  'Barbell Back Squat': {
    primaryMuscles: ['quadriceps', 'gluteos', 'core'],
    primaryJoints: [
      'joelho_direito',
      'joelho_esquerdo',
      'anca_direita',
      'anca_esquerda',
      'coluna_lombar',
    ],
    stressMultiplier: 1.4,
  },
  'Bodyweight Squat': {
    primaryMuscles: ['quadriceps', 'gluteos'],
    primaryJoints: ['joelho_direito', 'joelho_esquerdo', 'anca_direita', 'anca_esquerda'],
    stressMultiplier: 0.8,
  },
  'Machine Leg Press': {
    primaryMuscles: ['quadriceps', 'gluteos'],
    primaryJoints: ['joelho_direito', 'joelho_esquerdo', 'anca_direita', 'anca_esquerda'],
    stressMultiplier: 1.0,
  },
  'Barbell Hip Thrust': {
    primaryMuscles: ['gluteos'],
    primaryJoints: ['anca_direita', 'anca_esquerda'],
    stressMultiplier: 1.1,
  },

  // Core & Outros
  Crunch: {
    primaryMuscles: ['core'],
    primaryJoints: ['coluna_cervical'],
    stressMultiplier: 0.7,
  },
  Plank: {
    primaryMuscles: ['core', 'ombros'],
    primaryJoints: ['ombro_direito', 'ombro_esquerdo', 'coluna_lombar'],
    stressMultiplier: 0.9,
  },
  Burpee: {
    primaryMuscles: ['cardio', 'quadriceps', 'peito', 'core'],
    primaryJoints: [
      'joelho_direito',
      'joelho_esquerdo',
      'ombro_direito',
      'ombro_esquerdo',
      'tornozelo_direito',
      'tornozelo_esquerdo',
    ],
    stressMultiplier: 1.3,
  },
  Running: {
    primaryMuscles: ['cardio', 'quadriceps', 'isquiotibiais', 'panturrilhas'],
    primaryJoints: [
      'joelho_direito',
      'joelho_esquerdo',
      'tornozelo_direito',
      'tornozelo_esquerdo',
      'anca_direita',
      'anca_esquerda',
    ],
    stressMultiplier: 1.2,
  },
};
