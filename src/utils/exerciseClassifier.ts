import type { ExerciseCategory } from '../types/exercise';

// Mapeamento de nome do exercício para a sua respetiva categoria biomecânica
export const exerciseCategoryMap: Record<string, ExerciseCategory> = {
  // Compostos multiarticulares (peito, costas, pernas, ombros com barra livre/pesados)
  'Supino Plano': 'compound_multi',
  'Supino Inclinado': 'compound_multi',
  'Supino Reto': 'compound_multi',
  'Barbell Bench Press': 'compound_multi',
  'Barbell Incline Bench Press': 'compound_multi',
  'Dumbbell Bench Press': 'compound_multi',
  'Dumbbell Incline Bench Press': 'compound_multi',

  Agachamento: 'compound_multi',
  'Agachamento Livre': 'compound_multi',
  'Barbell Back Squat': 'compound_multi',

  'Peso Morto': 'compound_multi',
  'Levantamento Terra': 'compound_multi',
  'Barbell Deadlift': 'compound_multi',

  Desenvolvimento: 'compound_multi',
  'Press Militar': 'compound_multi',
  'Barbell Overhead Press': 'compound_multi',
  'Dumbbell Shoulder Press': 'compound_multi',

  'Remada Curvada': 'compound_multi',
  'Barbell Bent Over Row': 'compound_multi',

  'Puxada Frontal': 'compound_multi',
  'Cable Lat Pull Down Wide-Grip': 'compound_multi',

  // Compostos uniarticulares / guiados
  'Leg Press': 'compound_uni',
  'Machine Leg Press': 'compound_uni',
  'Cadeira Extensora': 'compound_uni',
  'Mesa Flexora': 'compound_uni',
  Crossover: 'compound_uni',
  'Barbell Hip Thrust': 'compound_uni',

  // Isolamento multiarticular (envolvem articulação primária, mas movimento isolado)
  'Rosca Direta': 'isolation_multi',
  'Barbell Bicep Curl': 'isolation_multi',
  'Tríceps Corda': 'isolation_multi',
  'Cable Rope Tricep Pushdown': 'isolation_multi',
  'Tríceps Testa': 'isolation_multi',
  'Elevação Lateral': 'isolation_multi',
  'Dumbbell Lateral Raise': 'isolation_multi',

  // Isolamento uniarticular estrito
  'Face Pull': 'isolation_uni',
  Panturrilha: 'isolation_uni',

  // Peso corporal / Calistenia
  Plank: 'bodyweight',
  'Barra Fixa': 'bodyweight',
  'Pull-Up': 'bodyweight',
  'Chin-Up': 'bodyweight',
  Fundos: 'bodyweight',
  Dips: 'bodyweight',
  Burpees: 'bodyweight',
  Burpee: 'bodyweight',
  'Push-Up': 'bodyweight',
  Flexões: 'bodyweight',
  Crunch: 'bodyweight',
  Abdominais: 'bodyweight',
  'Bodyweight Squat': 'bodyweight',
};

export const DEFAULT_CATEGORY: ExerciseCategory = 'compound_multi';

export function getExerciseCategory(exerciseName: string): ExerciseCategory {
  return exerciseCategoryMap[exerciseName] || DEFAULT_CATEGORY;
}
