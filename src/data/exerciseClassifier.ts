// src/data/exerciseClassifier.ts
import { ExerciseCategory } from '../types/exercise';

// Mapeamento de nome do exercício para categoria
export const exerciseCategoryMap: Record<string, ExerciseCategory> = {
  // Compostos multiarticulares (peito, costas, pernas grandes)
  'Supino Plano': 'compound_multi',
  'Supino Inclinado': 'compound_multi',
  'Supino Reto': 'compound_multi',
  'Barbell Bench Press': 'compound_multi',
  'Barbell Incline Bench Press': 'compound_multi',
  'Dumbbell Bench Press': 'compound_multi',
  'Dumbbell Incline Bench Press': 'compound_multi',
  'Agachamento': 'compound_multi',
  'Agachamento Livre': 'compound_multi',
  'Agachamento Frontal': 'compound_multi',
  'Barbell Back Squat': 'compound_multi',
  'Peso Morto': 'compound_multi',
  'Levantamento Terra': 'compound_multi',
  'Peso Morto Romeno': 'compound_multi',
  'Barbell Deadlift': 'compound_multi',
  'Desenvolvimento': 'compound_multi',
  'Press Militar': 'compound_multi',
  'Barbell Overhead Press': 'compound_multi',
  'Dumbbell Shoulder Press': 'compound_multi',
  'Remada Curvada': 'compound_multi',
  'Remada Curvada com Barra': 'compound_multi',
  'Barbell Bent Over Row': 'compound_multi',
  'Puxada Frontal': 'compound_multi',
  'Cable Lat Pull Down Wide-Grip': 'compound_multi',

  // Compostos uniarticulares
  'Leg Press': 'compound_uni',
  'Machine Leg Press': 'compound_uni',
  'Cadeira Extensora': 'compound_uni',
  'Mesa Flexora': 'compound_uni',
  'Crossover': 'compound_uni',
  'Pulley Frontal': 'compound_uni',
  'Remada Máquina': 'compound_uni',
  'Agachamento Búlgaro': 'compound_uni',
  'Barbell Hip Thrust': 'compound_uni',

  // Isolamento multiarticular (dois grupos, mas movimento isolado)
  'Rosca Direta': 'isolation_multi',
  'Rosca Direta com Barra': 'isolation_multi',
  'Barbell Bicep Curl': 'isolation_multi',
  'Rosca Martelo': 'isolation_multi',
  'Tríceps Testa': 'isolation_multi',
  'Tríceps Corda': 'isolation_multi',
  'Cable Rope Tricep Pushdown': 'isolation_multi',
  'Elevação Lateral': 'isolation_multi',
  'Dumbbell Lateral Raise': 'isolation_multi',
  'Elevação Frontal': 'isolation_multi',
  'Panturrilha em Pé': 'isolation_multi',

  // Isolamento uniarticular
  'Face Pull': 'isolation_uni',
  'Panturrilha Sentado': 'isolation_uni',
  'Panturrilha': 'isolation_uni',
  'Cadeira Flexora': 'isolation_uni',
  'Mesa Flexora Unilateral': 'isolation_uni',

  // Peso corporal
  'Flexões': 'bodyweight',
  'Push-Up': 'bodyweight',
  'Barra Fixa': 'bodyweight',
  'Pull-Up': 'bodyweight',
  'Chin-Up': 'bodyweight',
  'Mergulhos': 'bodyweight',
  'Fundos': 'bodyweight',
  'Dips': 'bodyweight',
  'Prancha': 'bodyweight',
  'Plank': 'bodyweight',
  'Abdominais': 'bodyweight',
  'Crunch': 'bodyweight',
  'Burpees': 'bodyweight',
  'Burpee': 'bodyweight',
  'Bodyweight Squat': 'bodyweight',
};

// Categoria padrão para exercícios não mapeados
export const DEFAULT_CATEGORY: ExerciseCategory = 'compound_multi';

export function getExerciseCategory(exerciseName: string): ExerciseCategory {
  return exerciseCategoryMap[exerciseName] || DEFAULT_CATEGORY;
}
