// @ts-nocheck
// src/services/injuryPrediction/riskModel.ts

import type { WorkoutPlan } from '../../types';
import type { InjuryRiskReport, StressReading, WorkoutModification } from '../../types/injury';
import { EXERCISE_REGION_MAP } from './exerciseRegionMap';

interface RiskFactor {
  name: string;
  weight: number;
  score: number; // 0-100
}

const RISK_THRESHOLD_LOW = 0.8; // AC Ratio < 0.8 = undertraining
const RISK_THRESHOLD_HIGH = 1.3; // AC Ratio > 1.3 = overtraining (risco elevado)
const RISK_THRESHOLD_CRITICAL = 1.5; // AC Ratio > 1.5 = risco crítico

export function calculateInjuryRisk(
  stressReadings: StressReading[],
  plannedWorkout?: WorkoutPlan,
  userBodyweight = 75,
): InjuryRiskReport {
  const flaggedRegions: StressReading[] = [];
  let totalRiskScore = 0;

  // Analisar cada região
  stressReadings.forEach((reading) => {
    let regionRisk = 0;

    // Fator 1: AC Ratio
    if (reading.acuteChronicRatio > RISK_THRESHOLD_CRITICAL) {
      regionRisk += 40;
    } else if (reading.acuteChronicRatio > RISK_THRESHOLD_HIGH) {
      regionRisk += 30;
    } else if (reading.acuteChronicRatio < RISK_THRESHOLD_LOW) {
      regionRisk += 10;
    }

    // Fator 2: Frequência excessiva
    if (reading.sessionsInLast7Days > 4) {
      regionRisk += 20;
    }

    // Fator 3: Recuperação insuficiente
    if (reading.recoveryScore < 30) {
      regionRisk += 25;
    }

    // Fator 4: Stress crónico elevado (normalizado ao peso corporal do utilizador)
    // ~60x bodyweight em effort = volume semanal extremo para qualquer atleta
    const chronicThreshold = userBodyweight * 60;
    if (reading.chronicStress > chronicThreshold) {
      regionRisk += 15;
    }

    // Classificar nível de risco
    let riskLevel: StressReading['riskLevel'] = 'low';
    if (regionRisk >= 70) riskLevel = 'critical';
    else if (regionRisk >= 50) riskLevel = 'high';
    else if (regionRisk >= 25) riskLevel = 'moderate';

    if (riskLevel !== 'low') {
      flaggedRegions.push({
        ...reading,
        riskLevel,
      });
    }

    totalRiskScore = Math.max(totalRiskScore, regionRisk);
  });

  // Calcular risco global
  let overallRisk: InjuryRiskReport['overallRisk'] = 'low';
  if (totalRiskScore >= 70) overallRisk = 'critical';
  else if (totalRiskScore >= 50) overallRisk = 'high';
  else if (totalRiskScore >= 25) overallRisk = 'moderate';

  // Gerar recomendações
  const recommendations = generateRecommendations(flaggedRegions, overallRisk);

  // Gerar modificações para o workout planeado
  const suggestedModifications = plannedWorkout
    ? generateWorkoutModifications(plannedWorkout, flaggedRegions)
    : [];

  // Estimar downtime se continuar
  const predictedDowntime =
    overallRisk === 'critical'
      ? 14
      : overallRisk === 'high'
        ? 7
        : overallRisk === 'moderate'
          ? 3
          : undefined;

  return {
    overallRisk,
    overallRiskScore: totalRiskScore,
    flaggedRegions,
    recommendations,
    suggestedModifications,
    predictedDowntime,
  };
}

function generateRecommendations(flagged: StressReading[], overallRisk: string): string[] {
  const recs: string[] = [];

  if (overallRisk === 'critical') {
    recs.push('🚨 RISCO CRÍTICO: Considera adiar o treino ou fazer apenas recuperação ativa hoje.');
  } else if (overallRisk === 'high') {
    recs.push('⚠️ Risco elevado detetado. Reduz a carga em 20-30% ou o volume pela metade.');
  }

  flagged.forEach((region) => {
    if (region.riskLevel === 'critical') {
      recs.push(
        `• ${region.region}: Stress acumulado é massivo. Descansa a articulação por 48-72h.`,
      );
    } else if (region.acuteChronicRatio > 1.3) {
      recs.push(
        `• ${region.region}: AC Ratio de ${region.acuteChronicRatio.toFixed(2)}. Aumento de carga muito rápido — reduz progressão.`,
      );
    }

    if (region.recoveryScore < 30) {
      recs.push(
        `• ${region.region}: Recuperação apenas ${region.recoveryScore}%. Prioriza sono e nutrição.`,
      );
    }
  });

  if (recs.length === 0) {
    recs.push('✅ Todos os sistemas verdes! Podes treinar com confiança.');
  }

  return recs;
}

function generateWorkoutModifications(
  plan: WorkoutPlan,
  flaggedRegions: StressReading[],
): WorkoutModification[] {
  const modifications: WorkoutModification[] = [];
  const riskyRegions = new Set(flaggedRegions.map((r) => r.region));

  plan.exercises.forEach((exObj) => {
    const exName = typeof exObj === 'string' ? exObj : (exObj as any).name;
    const mapping = EXERCISE_REGION_MAP[exName];
    if (!mapping) return;

    const affectedJoints = mapping.primaryJoints.filter((j) => riskyRegions.has(j));
    if (affectedJoints.length === 0) return;

    const maxRisk = Math.max(
      ...flaggedRegions
        .filter((r) => affectedJoints.includes(r.region))
        .map((r) => (r.riskLevel === 'critical' ? 3 : r.riskLevel === 'high' ? 2 : 1)),
    );

    if (maxRisk >= 3) {
      modifications.push({
        exerciseName: exName,
        originalType: 'swap',
        suggestion: `Risco crítico em ${affectedJoints.join(', ')}. Considera alternativa.`,
        alternativeExercise: suggestAlternative(exName, affectedJoints),
      });
    } else if (maxRisk >= 2) {
      modifications.push({
        exerciseName: exName,
        originalType: 'reduce_load',
        suggestion: `Reduz carga em 20% devido a stress em ${affectedJoints.join(', ')}.`,
      });
    }
  });

  return modifications;
}

function suggestAlternative(exerciseName: string, affectedJoints: string[]): string {
  // Lógica simples de substituição
  const alternatives: Record<string, string[]> = {
    'Barbell Bench Press': ['Dumbbell Bench Press', 'Push-Up'],
    'Barbell Overhead Press': ['Dumbbell Lateral Raise', 'Front Raise'],
    'Barbell Back Squat': ['Machine Leg Press', 'Bodyweight Squat'],
    'Barbell Deadlift': ['Barbell Hip Thrust', 'Leg Curl'],
    'Pull-Up': ['Cable Lat Pull Down Wide-Grip', 'Dumbbell Row'],
    Running: ['Cycling', 'Elliptical', 'Swimming'],
  };

  return alternatives[exerciseName]?.[0] || 'Recuperação ativa (Stretching)';
}
