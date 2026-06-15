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
    // ── Campos Demográficos (DemographicEngine) ──
    /** Idade em anos. Determina perfil youth_gamified (≤14) ou senior_joint_focus (≥60). */
    age?: number;
    /** Género do utilizador. 'female' activa opção de sincronização de ciclo. */
    gender?: 'male' | 'female' | 'other' | string;
    /** Activa o CycleTracker e modulação de intensidade para perfil female_cycle_synced. */
    wantsCycleSyncing?: boolean;
    // ── Campos de Preferência ──
    workoutStyle?: string;
    trainingDays?: string[];
    philosophy?: string;
    proMode?: boolean;
    dayPreferences?: Record<string, string>;
    anamnesis?: Anamnesis;
    bodyMeasurements?: BodyMeasurements[];
    startDate?: number;
    weeksActive?: number;
    // ── Campos Nutricionais (NutritionEngine) ──
    targetCalories?: number;
    targetProtein?: number;
    targetCarb?: number;
    targetFat?: number;
    activityLevel?: string;
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

export interface WorkoutPlan {
    id: string;
    label: string;
    exercises: string[];
}
