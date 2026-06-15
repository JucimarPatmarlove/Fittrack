// src/services/advancedFeatures.ts
import { UserProfile } from "../types";
import { WorkoutSession } from "../db/schema";;

export interface NutritionIntegration {
    logMeal(calories: number, macros: { protein: number; carbs: number; fats: number }): void;
    getDailyCalorieTarget(goal: string, weight: number, height: number): number;
}

export interface SocialFeature {
    followUser(userId: string): void;
    copyWorkout(workoutId: string): any; // Retornaria o WorkoutPlan
}

export const AdvancedFilters = {
    byMuscle: (exercises: any[], muscle: string) => exercises.filter(e => e.muscle === muscle),
    byEquipment: (exercises: any[], equipment: string[]) => exercises.filter(e =>
        equipment.some(eq => e.equipment?.includes(eq))
    ),
};