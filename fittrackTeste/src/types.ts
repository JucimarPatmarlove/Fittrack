/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export interface UserProfile {
  weight: number;      // kg
  height: number;      // cm
  age: number;         // anos
  gender: "male" | "female" | "other";
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  targetCalories: number; // kcal/dia
  targetProtein: number;  // g/dia
  targetCarb: number;     // g/dia
  targetFat: number;      // g/dia
}

export interface Exercise {
  id: string;
  name: string;
  type: "strength" | "cardio" | "mobility";
  duration: number; // minutos
  caloriesBurned: number;
  sets?: number;
  reps?: number;
  weightKg?: number;
  date: string; // formato YYYY-MM-DD
}

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number; // g
  carb: number;    // g
  fat: number;     // g
}

export interface DailyMealLog {
  date: string; // YYYY-MM-DD
  breakfast: MealItem[];
  lunch: MealItem[];
  snack: MealItem[];
  dinner: MealItem[];
}

export interface HydrationLog {
  date: string; // YYYY-MM-DD
  mlConsumed: number;
}

export interface WeightLog {
  date: string; // YYYY-MM-DD
  weight: number; // kg
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
