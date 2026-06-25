import { UserProfile } from '../types';
import { MealItem } from '../db/schema';

// Exporting FitnessGoal and ActivityLevel as types since they were merged into UserProfile or kept as constants
export enum FitnessGoal {
  LOSE_WEIGHT = "LOSE_WEIGHT",
  GAIN_MUSCLE = "GAIN_MUSCLE",
  MAINTAIN = "MAINTAIN",
  HEALTH = "HEALTH",
}

export enum ActivityLevel {
  SEDENTARY = "SEDENTARY", // Pouco ou nenhum exercício
  LIGHT = "LIGHT",         // Exercício leve 1-3 dias/semana
  MODERATE = "MODERATE",   // Exercício moderado 3-5 dias/semana
  ACTIVE = "ACTIVE",       // Exercício intenso 6-7 dias/semana
  VERY_ACTIVE = "VERY_ACTIVE" // Treino de atleta/trabalho manual pesado
}

// ---- Constants and Lookup Tables ----

interface MacroSplit {
  proteinRatio: number;
  carbRatio: number;
  fatRatio: number;
}

const GOAL_CALORIE_ADJUSTMENT: Record<FitnessGoal, (tdee: number) => number> = {
  [FitnessGoal.LOSE_WEIGHT]: (tdee) => Math.max(1200, Math.round(tdee - 500)),
  [FitnessGoal.GAIN_MUSCLE]: (tdee) => Math.round(tdee + 400),
  [FitnessGoal.MAINTAIN]: (tdee) => tdee,
  [FitnessGoal.HEALTH]: (tdee) => Math.max(1500, Math.round(tdee - 100)),
};

const GOAL_MACRO_SPLITS: Record<FitnessGoal, MacroSplit> = {
  [FitnessGoal.LOSE_WEIGHT]: { proteinRatio: 0.35, carbRatio: 0.40, fatRatio: 0.25 },
  [FitnessGoal.GAIN_MUSCLE]: { proteinRatio: 0.30, carbRatio: 0.45, fatRatio: 0.25 },
  [FitnessGoal.MAINTAIN]: { proteinRatio: 0.25, carbRatio: 0.50, fatRatio: 0.25 },
  [FitnessGoal.HEALTH]: { proteinRatio: 0.25, carbRatio: 0.50, fatRatio: 0.25 },
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHT]: 1.375,
  [ActivityLevel.MODERATE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9,
};

const GOAL_STRING_MAP: Record<string, FitnessGoal> = {
  'hipertrofia': FitnessGoal.GAIN_MUSCLE,
  'forca': FitnessGoal.GAIN_MUSCLE,
  'perda_peso': FitnessGoal.LOSE_WEIGHT,
  'saude': FitnessGoal.HEALTH,
  'condicionamento': FitnessGoal.HEALTH,
};

const ACTIVITY_STRING_MAP: Record<string, ActivityLevel> = {
  'sedentario': ActivityLevel.SEDENTARY,
  'praticante_irregular': ActivityLevel.LIGHT,
  'praticante_regular': ActivityLevel.ACTIVE,
};

// ---- Pure utility functions ----

/** Calculate BMR using Mifflin-St Jeor Equation */
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'male') return 10 * weight + 6.25 * height - 5 * age + 5;
  if (gender === 'female') return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age - 78; // average / other
}

/** Map string goal to FitnessGoal enum */
function mapToFitnessGoal(goal?: string): FitnessGoal {
  if (!goal) return FitnessGoal.MAINTAIN;
  return GOAL_STRING_MAP[goal] || FitnessGoal.MAINTAIN;
}

/** Map string activity level to ActivityLevel enum */
function mapToActivityLevel(activityLevel?: string): ActivityLevel {
  if (!activityLevel) return ActivityLevel.MODERATE;
  return ACTIVITY_STRING_MAP[activityLevel] || ActivityLevel.MODERATE;
}

// ---- Main Function ----

// Mifflin-St Jeor Equation to calculate BMR and dynamic TDEE macro splits
export function calculateMacros(profile: UserProfile): UserProfile {
  // If required fields are missing, return profile as is or with defaults
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 30;
  const gender = profile.gender || 'other';

  const goal = mapToFitnessGoal(profile.goal);
  const activityLevel = mapToActivityLevel(profile.anamnesis?.activityLevel);

  // Basal Metabolic Rate (BMR)
  const bmr = calculateBMR(weight, height, age, gender);

  // Total Daily Energy Expenditure (TDEE)
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  const tdee = Math.round(bmr * multiplier);

  // Target calories based on dynamic goals
  const adjustCalories = GOAL_CALORIE_ADJUSTMENT[goal];
  const targetCalories = adjustCalories(tdee);

  // Macro calculations using lookup tables
  const split = GOAL_MACRO_SPLITS[goal];
  const targetProtein = Math.round((targetCalories * split.proteinRatio) / 4);
  const targetCarb = Math.round((targetCalories * split.carbRatio) / 4);
  const targetFat = Math.round((targetCalories * split.fatRatio) / 9);

  return {
    ...profile,
    targetCalories,
    targetProtein,
    targetCarb,
    targetFat,
  };
}

// Translations helper
export function translateGoal(goal: FitnessGoal): string {
  const goalLabels: Record<FitnessGoal, string> = {
    [FitnessGoal.LOSE_WEIGHT]: 'Perda de Peso (Déficit)',
    [FitnessGoal.GAIN_MUSCLE]: 'Hipertrofia / Ganho de Massa',
    [FitnessGoal.MAINTAIN]: 'Manutenção de Peso',
    [FitnessGoal.HEALTH]: 'Saúde e Bem-Esta Geral',
  };
  return goalLabels[goal];
}

export function translateActivityLevel(level: ActivityLevel): string {
  const levelLabels: Record<ActivityLevel, string> = {
    [ActivityLevel.SEDENTARY]: 'Sedentário (Sem Exercício)',
    [ActivityLevel.LIGHT]: 'Leve (Exercício 1-3 dias/semana)',
    [ActivityLevel.MODERATE]: 'Moderado (Exercício 3-5 dias/semana)',
    [ActivityLevel.ACTIVE]: 'Ativo (Intenso 6-7 dias/semana)',
    [ActivityLevel.VERY_ACTIVE]: 'Muito Ativo (Esportista/Atleta)',
  };
  return levelLabels[level];
}

// Standard prepopulated food items with Portuguese labels
export const PRESET_FOODS: Omit<MealItem, 'id'>[] = [
  { name: 'Peito de Frango Grelhado (100g)', calories: 165, protein: 31, carb: 0, fat: 3.6 },
  { name: 'Arroz Integral Cozido (100g)', calories: 111, protein: 2.6, carb: 23, fat: 0.9 },
  { name: 'Feijão Preto Cozido (100g)', calories: 132, protein: 8.9, carb: 23.7, fat: 0.5 },
  { name: 'Ovo de Galinha Inteiro Cozido (1 unid)', calories: 78, protein: 6.3, carb: 0.6, fat: 5.3 },
  { name: 'Banana Prata Média (1 unid)', calories: 90, protein: 1.1, carb: 23, fat: 0.3 },
  { name: 'Whey Protein Isolado (1 scoop - 30g)', calories: 120, protein: 25, carb: 2, fat: 1 },
  { name: 'Batata Doce Cozida (100g)', calories: 86, protein: 1.6, carb: 20, fat: 0.1 },
  { name: 'Salmão Grelhado (100g)', calories: 206, protein: 22, carb: 0, fat: 12 },
  { name: 'Castanha de Caju (20g)', calories: 114, protein: 3.6, carb: 6, fat: 9 },
  { name: 'Brocolis Cozido (100g)', calories: 35, protein: 2.4, carb: 7, fat: 0.4 },
  { name: 'Tapioca pronta (50g)', calories: 130, protein: 0.2, carb: 32, fat: 0.1 },
  { name: 'Iogurte Desnatado Natural (170g)', calories: 70, protein: 6.8, carb: 9, fat: 0 },
  { name: 'Azeite de Oliva Extra Virgem (1 colher de sopa)', calories: 119, protein: 0, carb: 0, fat: 13.5 },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}