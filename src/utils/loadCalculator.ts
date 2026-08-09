// @ts-nocheck
// src/utils/loadCalculator.ts
import { ExerciseCategory, Goal, UserLevel } from '../types/exercise';

export interface LoadCalculationInput {
  oneRM: number;                   // 1RM estimado (kg)
  targetReps: number;             // reps alvo (ex: 8)
  category: ExerciseCategory;
  userLevel: UserLevel;
  age: number;
  goal: Goal;
  injuryModifier?: number;        // 0.5 a 1.0 (default 1.0)
}

// Percentagem base (%1RM) por categoria e número de reps (calculamos uma função linear)
// Valores de referência para 10 reps:
const BASE_PERCENTAGE_10_REPS: Record<ExerciseCategory, number> = {
  compound_multi: 70,      // 70% 1RM para 10 reps
  compound_uni: 80,        // 80% 1RM
  isolation_multi: 55,     // 55% 1RM
  isolation_uni: 75,       // 75% 1RM
  bodyweight: 0,           // bodyweight usa outra lógica
};

// Ajuste por nível
const LEVEL_FACTOR: Record<string, number> = {
  iniciante: 0.8,
  intermedio: 0.95,
  avancado: 1.05,
};

// Ajuste por idade (>50)
const AGE_FACTOR = 0.85;

// Ajuste por objetivo (multiplicador adicional sobre o factor base)
const GOAL_FACTOR: Record<string, number> = {
  forca: 1.1,      // mais peso
  hipertrofia: 1.0,
  resistencia: 0.85,
};

function getSafeLevelFactor(level: UserLevel): number {
  const lvl = String(level || '').toLowerCase();
  if (LEVEL_FACTOR[lvl] !== undefined) return LEVEL_FACTOR[lvl];
  if (lvl.includes('begin') || lvl.includes('iniciante')) return LEVEL_FACTOR.iniciante;
  if (lvl.includes('adv') || lvl.includes('avancado') || lvl.includes('pro')) return LEVEL_FACTOR.avancado;
  return LEVEL_FACTOR.intermedio;
}

function getSafeGoalFactor(goal: Goal): number {
  const g = String(goal || '').toLowerCase();
  if (GOAL_FACTOR[g] !== undefined) return GOAL_FACTOR[g];
  if (g.includes('forc') || g.includes('forç')) return GOAL_FACTOR.forca;
  if (g.includes('resist') || g.includes('condicionamento') || g.includes('perda')) return GOAL_FACTOR.resistencia;
  return GOAL_FACTOR.hipertrofia;
}

// Obtém percentagem para um dado número de reps (linear entre 5 e 15 reps)
function getPercentageForReps(category: ExerciseCategory, reps: number): number {
  if (category === 'bodyweight') return 0;
  if (reps <= 3) return 90;
  if (reps >= 20) return 50;
  const base10 = BASE_PERCENTAGE_10_REPS[category] || 70;
  // A cada rep acima de 10, reduz 2%; a cada rep abaixo, aumenta 2%
  const delta = (reps - 10) * 2;
  let pct = base10 - delta;
  pct = Math.min(92, Math.max(45, pct));
  return pct;
}

// Função principal
export function calculateSuggestedWeight(input: LoadCalculationInput): number {
  const { oneRM, targetReps, category, userLevel, age, goal, injuryModifier = 1.0 } = input;
  if (category === 'bodyweight') {
    // Para peso corporal, retorna 0 (o atleta só regista reps)
    return 0;
  }
  if (oneRM <= 0) return 0;

  const basePercentage = getPercentageForReps(category, targetReps);
  // Aplica factores
  let factor = getSafeLevelFactor(userLevel);
  if (age >= 50) factor *= AGE_FACTOR;
  factor *= getSafeGoalFactor(goal);
  factor *= injuryModifier;

  let weight = oneRM * (basePercentage / 100) * factor;
  // Arredonda ao múltiplo de 2.5 kg
  weight = Math.round(weight / 2.5) * 2.5;
  return Math.max(0, weight);
}
