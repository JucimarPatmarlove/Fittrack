// src/types.ts

export interface UserProfile {
    name: string;
    goal: string;
    level: string;
    weight: number; 
    height?: number;
    fitnessLevel?: string;
    availableEquipment?: string[];
    injuries?: string[];
    weeklyAvailability?: number;
    preferredWorkoutDuration?: number;
    mainLimitation?: string;
    xp?: number;
    gender?: string;
    workoutStyle?: string;
    trainingDays?: string[];
}

export interface ExerciseSet {
    reps: number;
    weight: number;
    rpe?: number;
    done?: boolean;
    isWarmup?: boolean;
}

export interface ExerciseSession {
    name: string;
    muscle: string;
    sets: ExerciseSet[];
}

export interface WorkoutSession {
    date: string;
    dayLabel: string;
    duration: number;
    exercises: ExerciseSession[];
    totalVolume: number;
    avgRPE?: number;
    intensity?: string | number;
    notes?: string;
    calories?: number;
}

export interface WorkoutPlan {
    id: string;
    label: string;
    exercises: string[];
}
