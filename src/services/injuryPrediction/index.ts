// @ts-nocheck
// src/services/injuryPrediction/index.ts

import type { WorkoutPlan } from '../../types';
import type { InjuryRiskReport, RecoveryInput, StressReading } from '../../types/injury';
import { calculateRecoveryScore, estimateRecoveryTime } from './recoveryTracker';
import { calculateInjuryRisk } from './riskModel';
import {
  type WorkoutHistoryEntry,
  calculateACRatio,
  calculateSessionStress,
} from './stressCalculator';
import { createSpan } from '../../utils/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';

export interface InjuryEngineInput {
  workoutHistory: WorkoutHistoryEntry[];
  userBodyweight: number;
  plannedWorkout?: WorkoutPlan;
  recoveryData?: RecoveryInput;
}

export function runInjuryPrediction(input: InjuryEngineInput): InjuryRiskReport {
  const span = createSpan('injury.predict', { userBodyweight: input.userBodyweight });
  try {
    const { workoutHistory, userBodyweight, plannedWorkout, recoveryData } = input;

    // 1. Calcular stress de todas as sessões históricas
    const allStresses = workoutHistory.flatMap((w) => calculateSessionStress(w, userBodyweight));

    // 2. Agrupar por região e calcular AC Ratio
    const regions = new Set(allStresses.map((s) => s.region));
    const stressReadings: StressReading[] = [];

    regions.forEach((region) => {
      const regionHistory = workoutHistory.filter((w) =>
        calculateSessionStress(w, userBodyweight).some((s) => s.region === region),
      );

      const { acute, chronic, ratio } = calculateACRatio(regionHistory, region, userBodyweight);

      // Calcular recovery score para esta região
      let recoveryScore = 75; // Optimistic default — assume healthy without data
      if (recoveryData) {
        recoveryScore = calculateRecoveryScore(recoveryData);
      }

      // Contar sessões nos últimos 7 dias
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const sessions7d = regionHistory.filter((w) => new Date(w.date) >= last7Days).length;

      stressReadings.push({
        region,
        muscle: allStresses.find((s) => s.region === region)?.muscle || 'core',
        acuteStress: acute,
        chronicStress: chronic,
        acuteChronicRatio: ratio,
        recoveryScore,
        riskLevel:
          ratio > 1.5 ? 'critical' : ratio > 1.3 ? 'high' : ratio < 0.8 ? 'moderate' : 'low',
        lastTrained: regionHistory[regionHistory.length - 1]?.date || new Date().toISOString(),
        sessionsInLast7Days: sessions7d,
      });
    });

    // 3. Calcular risco
    const result = calculateInjuryRisk(stressReadings, plannedWorkout, userBodyweight);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
    throw error;
  } finally {
    span.end();
  }
}

// Exportar funções individuais para uso granular
export { calculateSessionStress, calculateACRatio, calculateRecoveryScore, estimateRecoveryTime };
