// src/services/injuryPrediction/recoveryTracker.ts

import type { RecoveryInput, StressReading } from '../../types/injury';

/**
 * Calcula um Recovery Score (0-100) baseado em múltiplos inputs
 */
export function calculateRecoveryScore(input: RecoveryInput): number {
  const { sleepHours, sleepQuality, hrv, restingHR, muscleSoreness, mood, stressLevel } = input;

  // Sleep score (30% do total)
  const sleepScore = Math.min((sleepHours / 8) * 10, 10) * (sleepQuality / 10) * 3;

  // HRV score (20% do total) — comparado com baseline do user
  // (Num cenário real, isto faria comparação dinâmica com a baseline dos últimos 30 dias)
  const hrvScore = hrv ? Math.min((hrv / 50) * 2, 2) * 10 : 10; // Default se não tiver HRV

  // Resting HR score (10%)
  const hrScore = restingHR ? Math.max(0, (80 - restingHR) / 30) * 10 : 5;

  // Soreness score (20%) — inverso da dor
  const sorenessKeys = Object.keys(muscleSoreness);
  let sorenessScore = 10;
  if (sorenessKeys.length > 0) {
    const avgSoreness =
      Object.values(muscleSoreness).reduce((a, b) => a + b, 0) / sorenessKeys.length;
    sorenessScore = (10 - avgSoreness) * 2;
  } else {
    sorenessScore = 20; // 20 pontos máximos se não houver dores registadas
  }

  // Mood/Stress score (20%)
  const mentalScore = (mood / 10) * 10 + ((10 - stressLevel) / 10) * 10;

  const total = sleepScore + hrvScore + hrScore + sorenessScore + mentalScore;
  return Math.min(Math.round(total), 100);
}

/**
 * Estima tempo de recuperação necessário para uma região (em horas)
 */
export function estimateRecoveryTime(stressReading: StressReading, recoveryScore: number): number {
  const baseRecovery = 24; // 24h base

  // Multiplicadores
  const stressMultiplier = stressReading.acuteStress / 500; // Normalizado para a escala de XP/Esforço
  const recoveryMultiplier = (100 - recoveryScore) / 50; // Menos recuperação = mais tempo

  const hours = baseRecovery * (1 + stressMultiplier) * (1 + recoveryMultiplier);

  return Math.round(hours);
}
