// @ts-nocheck
import { getAllExercisesFromHistory, getRecentSetLogsDecrypted } from '../db/encryptedDb';
import type { SetLog } from '../db/schema';
import type { DemographicProfile } from './demographicEngine';

export type InjuryRisk = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface InjuryAssessment {
  overallRisk: InjuryRisk;
  acwr: number; // Acute:Chronic Workload Ratio
  acuteLoad: number; // Carga últimos 7 dias (kg)
  chronicLoad: number; // Carga média últimos 28 dias (kg)
  warnings: string[];
  alternativeExercises?: string[];
  restrictedExercises?: string[];
}

interface RiskConfig {
  risk: InjuryRisk;
  warnings: string[];
  restricted: string[];
  alternatives: string[];
}

const FOUR_WEEKS_MS = 28 * 24 * 3600 * 1000;
const ONE_WEEK_MS = 7 * 24 * 3600 * 1000;

// ---- Pure utility functions ----

/** Fetch all set logs for given exercises within the last 4 weeks */
async function fetchRecentSets(exercisesToCheck?: string[]): Promise<SetLog[]> {
  const fourWeeksAgo = Date.now() - FOUR_WEEKS_MS;

  if (exercisesToCheck && exercisesToCheck.length > 0) {
    const setsPromises = exercisesToCheck.map((ex) => getRecentSetLogsDecrypted(ex, 200));
    const setsArrays = await Promise.all(setsPromises);
    return setsArrays.flat().filter((s) => s.timestamp > fourWeeksAgo);
  }

  const allExercises = await getAllExercisesFromHistory();
  const setsPromises = allExercises.map((ex) => getRecentSetLogsDecrypted(ex, 200));
  const setsArrays = await Promise.all(setsPromises);
  return setsArrays.flat().filter((s) => s.timestamp > fourWeeksAgo);
}

/** Calculate acute and chronic loads from sets */
function calculateLoads(sets: SetLog[]) {
  const now = Date.now();
  const acuteStart = now - ONE_WEEK_MS;
  const chronicStart = now - FOUR_WEEKS_MS;

  let acuteLoad = 0;
  let chronicLoad = 0;

  for (const set of sets) {
    const load = set.weightKg * set.repsCompleted;
    if (set.timestamp >= acuteStart) acuteLoad += load;
    if (set.timestamp >= chronicStart) chronicLoad += load;
  }

  return { acuteLoad, chronicLoad, chronicAvg: chronicLoad / 4 };
}

/** Determine base risk from ACWR value */
function classifyBaseRisk(acwr: number): InjuryRisk {
  if (acwr > 1.5) return 'CRITICAL';
  if (acwr > 1.3) return 'HIGH';
  if (acwr > 0.8) return 'MODERATE';
  return 'LOW';
}

/** Adjust risk based on demographic profile */
function adjustRiskForDemographic(
  baseRisk: InjuryRisk,
  acwr: number,
  demographicProfile: DemographicProfile,
): InjuryRisk {
  if (demographicProfile !== 'senior_joint_focus') return baseRisk;

  if (acwr > 1.2 && baseRisk !== 'CRITICAL') return 'HIGH';
  if (acwr > 1.0 && baseRisk === 'LOW') return 'MODERATE';

  return baseRisk;
}

/** Build risk configuration with warnings and recommendations */
function buildRiskConfig(adjustedRisk: InjuryRisk, acwr: number): RiskConfig {
  switch (adjustedRisk) {
    case 'CRITICAL':
      return {
        risk: 'CRITICAL',
        warnings: [
          `🚨 RISCO CRÍTICO! ACWR = ${acwr.toFixed(2)} – carga das últimas 2 semanas muito acima do normal.`,
          'Suspende treinos de alta intensidade por 3-5 dias. Foco em mobilidade e cardio leve.',
        ],
        restricted: ['barbell deadlift', 'barbell back squat', 'box jump', 'burpee', 'sprint'],
        alternatives: ['walking', 'stretching', 'yoga', 'foam rolling'],
      };
    case 'HIGH':
      return {
        risk: 'HIGH',
        warnings: [`⚠️ Risco elevado (ACWR = ${acwr.toFixed(2)}). Reduz volume em 30% esta semana.`],
        restricted: ['jump squat', 'clean and jerk'],
        alternatives: ['dumbell bench press', 'machine leg press'],
      };
    case 'MODERATE':
      return {
        risk: 'MODERATE',
        warnings: [
          `⚖️ Atenção: ACWR = ${acwr.toFixed(2)}. Mantém carga, mas evita picos de intensidade.`,
        ],
        restricted: [],
        alternatives: [],
      };
    default:
      return {
        risk: 'LOW',
        warnings: [`✅ Zona doce. ACWR = ${acwr.toFixed(2)}. Progressão segura.`],
        restricted: [],
        alternatives: [],
      };
  }
}

// ---- Main exported function ----

export async function analyzeInjuryRisk(
  userId: string,
  demographicProfile: DemographicProfile,
  exercisesToCheck?: string[],
): Promise<InjuryAssessment> {
  const allSets = await fetchRecentSets(exercisesToCheck);

  if (allSets.length === 0) {
    return {
      overallRisk: 'LOW',
      acwr: 0,
      acuteLoad: 0,
      chronicLoad: 0,
      warnings: ['Sem dados suficientes para análise de risco. Completa mais treinos.'],
    };
  }

  const { acuteLoad, chronicAvg } = calculateLoads(allSets);
  const acwr = chronicAvg > 0 ? acuteLoad / chronicAvg : 0;

  const baseRisk = classifyBaseRisk(acwr);
  const adjustedRisk = adjustRiskForDemographic(baseRisk, acwr, demographicProfile);
  const config = buildRiskConfig(adjustedRisk, acwr);

  return {
    overallRisk: config.risk,
    acwr: Math.round(acwr * 100) / 100,
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicAvg),
    warnings: config.warnings,
    restrictedExercises: config.restricted,
    alternativeExercises: config.alternatives,
  };
}
