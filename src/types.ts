// src/types.ts

export interface Anamnesis {
    medicalConditions: string[];
    activityLevel: 'sedentario' | 'praticante_irregular' | 'praticante_regular';
    weeklyFrequencyTarget: number;
    goalPriorities: string[];
    targetZone: string;
    motivationScore: number;
}

export interface BodyMeasurements {
    date: number;
    weightKg: number;
    heightCm: number;
    bodyFatPercentage: number;
    leanMassPercentage: number;
    visceralFat: number;
    bloodPressure: string;
    restingHeartRate: number;
    circumferences: {
        chest?: number;
        waist?: number;
        abdominal?: number;
        hips?: number;
        bicepRight?: number;
        bicepLeft?: number;
        thighRight?: number;
        thighLeft?: number;
        calfRight?: number;
        calfLeft?: number;
    };
}

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
    philosophy?: string;
    anamnesis?: Anamnesis;
    bodyMeasurements?: BodyMeasurements[];
    startDate?: number;
    weeksActive?: number;
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
