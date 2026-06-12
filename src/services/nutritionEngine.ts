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

// Mifflin-St Jeor Equation to calculate BMR and dynamic TDEE macro splits
export function calculateMacros(profile: UserProfile): UserProfile {
  // If required fields are missing, return profile as is or with defaults
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 30;
  const gender = profile.gender || "other";
  
  // Try to parse goal to FitnessGoal enum, fallback to MAINTAIN
  let goal = FitnessGoal.MAINTAIN;
  if (profile.goal === "hipertrofia" || profile.goal === "forca") goal = FitnessGoal.GAIN_MUSCLE;
  else if (profile.goal === "perda_peso") goal = FitnessGoal.LOSE_WEIGHT;
  else if (profile.goal === "saude" || profile.goal === "condicionamento") goal = FitnessGoal.HEALTH;
  
  let activityLevel = ActivityLevel.MODERATE;
  if (profile.anamnesis) {
    if (profile.anamnesis.activityLevel === "sedentario") activityLevel = ActivityLevel.SEDENTARY;
    else if (profile.anamnesis.activityLevel === "praticante_irregular") activityLevel = ActivityLevel.LIGHT;
    else if (profile.anamnesis.activityLevel === "praticante_regular") activityLevel = ActivityLevel.ACTIVE;
  }

  // Basal Metabolic Rate (BMR)
  let bmr = 0;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === "female") {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 78; // average / other
  }

  // Activity Multipliers
  let multiplier = 1.2;
  switch (activityLevel) {
    case ActivityLevel.SEDENTARY: multiplier = 1.2; break;
    case ActivityLevel.LIGHT: multiplier = 1.375; break;
    case ActivityLevel.MODERATE: multiplier = 1.55; break;
    case ActivityLevel.ACTIVE: multiplier = 1.725; break;
    case ActivityLevel.VERY_ACTIVE: multiplier = 1.9; break;
  }

  const tdee = Math.round(bmr * multiplier);
  
  // Target calories based on dynamic goals
  let targetCalories = tdee;
  if (goal === FitnessGoal.LOSE_WEIGHT) {
    targetCalories = Math.max(1200, Math.round(tdee - 500)); // Caloric deficit
  } else if (goal === FitnessGoal.GAIN_MUSCLE) {
    targetCalories = Math.round(tdee + 400); // Caloric surplus
  } else if (goal === FitnessGoal.HEALTH) {
    targetCalories = Math.max(1500, Math.round(tdee - 100)); // Slight deficit or health balance
  }

  // Macro calculations
  // High protein for muscle gain or weight loss preservation
  let proteinRatio = 0.25; // 25% of calories
  let carbRatio = 0.50;    // 50% of calories
  let fatRatio = 0.25;     // 25% of calories

  if (goal === FitnessGoal.LOSE_WEIGHT) {
    proteinRatio = 0.35; // 35% protein to protect lean mass
    carbRatio = 0.40;    // 40% carbs
    fatRatio = 0.25;     // 25% fats
  } else if (goal === FitnessGoal.GAIN_MUSCLE) {
    proteinRatio = 0.30; // 30% protein (high building blocks)
    carbRatio = 0.45;    // 45% carbs (energy)
    fatRatio = 0.25;     // 25% fats
  }

  const targetProtein = Math.round((targetCalories * proteinRatio) / 4);
  const targetCarb = Math.round((targetCalories * carbRatio) / 4);
  const targetFat = Math.round((targetCalories * fatRatio) / 9);

  return {
    ...profile,
    targetCalories,
    targetProtein,
    targetCarb,
    targetFat
  };
}

// Translations helper
export function translateGoal(goal: FitnessGoal): string {
  switch (goal) {
    case FitnessGoal.LOSE_WEIGHT: return "Perda de Peso (Déficit)";
    case FitnessGoal.GAIN_MUSCLE: return "Hipertrofia / Ganho de Massa";
    case FitnessGoal.MAINTAIN: return "Manutenção de Peso";
    case FitnessGoal.HEALTH: return "Saúde e Bem-Esta Geral";
  }
}

export function translateActivityLevel(level: ActivityLevel): string {
  switch (level) {
    case ActivityLevel.SEDENTARY: return "Sedentário (Sem Exercício)";
    case ActivityLevel.LIGHT: return "Leve (Exercício 1-3 dias/semana)";
    case ActivityLevel.MODERATE: return "Moderado (Exercício 3-5 dias/semana)";
    case ActivityLevel.ACTIVE: return "Ativo (Intenso 6-7 dias/semana)";
    case ActivityLevel.VERY_ACTIVE: return "Muito Ativo (Esportista/Atleta)";
  }
}

// Standard prepopulated food items with Portuguese labels
export const PRESET_FOODS: Omit<MealItem, "id">[] = [
  { name: "Peito de Frango Grelhado (100g)", calories: 165, protein: 31, carb: 0, fat: 3.6 },
  { name: "Arroz Integral Cozido (100g)", calories: 111, protein: 2.6, carb: 23, fat: 0.9 },
  { name: "Feijão Preto Cozido (100g)", calories: 132, protein: 8.9, carb: 23.7, fat: 0.5 },
  { name: "Ovo de Galinha Inteiro Cozido (1 unid)", calories: 78, protein: 6.3, carb: 0.6, fat: 5.3 },
  { name: "Banana Prata Média (1 unid)", calories: 90, protein: 1.1, carb: 23, fat: 0.3 },
  { name: "Whey Protein Isolado (1 scoop - 30g)", calories: 120, protein: 25, carb: 2, fat: 1 },
  { name: "Batata Doce Cozida (100g)", calories: 86, protein: 1.6, carb: 20, fat: 0.1 },
  { name: "Salmão Grelhado (100g)", calories: 206, protein: 22, carb: 0, fat: 12 },
  { name: "Castanha de Caju (20g)", calories: 114, protein: 3.6, carb: 6, fat: 9 },
  { name: "Brocolis Cozido (100g)", calories: 35, protein: 2.4, carb: 7, fat: 0.4 },
  { name: "Tapioca pronta (50g)", calories: 130, protein: 0.2, carb: 32, fat: 0.1 },
  { name: "Iogurte Desnatado Natural (170g)", calories: 70, protein: 6.8, carb: 9, fat: 0 },
  { name: "Azeite de Oliva Extra Virgem (1 colher de sopa)", calories: 119, protein: 0, carb: 0, fat: 13.5 },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
