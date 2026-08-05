// src/types/injury.ts

export type BodyRegion = 
  | "ombro_esquerdo" | "ombro_direito"
  | "cotovelo_esquerdo" | "cotovelo_direito"
  | "punho_esquerdo" | "punho_direito"
  | "coluna_cervical" | "coluna_toracica" | "coluna_lombar"
  | "anca_esquerda" | "anca_direita"
  | "joelho_esquerdo" | "joelho_direito"
  | "tornozelo_esquerdo" | "tornozelo_direito";

export type MuscleGroup =
  | "peito" | "costas" | "ombros" | "biceps" | "triceps"
  | "core" | "quadriceps" | "isquiotibiais" | "gluteos"
  | "adutores" | "abdutores" | "panturrilhas" | "cardio";

export interface StressReading {
  region: BodyRegion;
  muscle: MuscleGroup;
  acuteStress: number;      // Stress da última sessão (0-100)
  chronicStress: number;    // Média móvel das últimas 4 semanas (0-100)
  acuteChronicRatio: number; // AC Ratio — métrica ouro para lesões
  recoveryScore: number;     // 0-100 (100 = totalmente recuperado)
  riskLevel: "low" | "moderate" | "high" | "critical";
  lastTrained: string;       // ISO date
  sessionsInLast7Days: number;
}

export interface InjuryRiskReport {
  overallRisk: "low" | "moderate" | "high" | "critical";
  overallRiskScore: number; // 0-100
  flaggedRegions: StressReading[];
  recommendations: string[];
  suggestedModifications: WorkoutModification[];
  predictedDowntime?: number; // dias estimados de recuperação se continuar
}

export interface WorkoutModification {
  exerciseName: string;
  originalType: "keep" | "reduce_load" | "reduce_volume" | "swap" | "remove";
  suggestion: string;
  alternativeExercise?: string;
}

export interface RecoveryInput {
  sleepHours: number;        // 0-12
  sleepQuality: number;      // 1-10
  hrv?: number;              // Heart Rate Variability (ms)
  restingHR?: number;        // BPM
  muscleSoreness: Record<string, number>; // 0-10 por grupo muscular
  mood: number;              // 1-10
  stressLevel: number;       // 1-10 (stress psicológico)
}
