import { getRecentSetLogsDecrypted, getAllExercisesFromHistory } from '../db/encryptedDb';
import { SetLog } from '../db/schema';
import { DemographicProfile } from './demographicEngine';

export type InjuryRisk = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface InjuryAssessment {
  overallRisk: InjuryRisk;
  acwr: number;               // Acute:Chronic Workload Ratio
  acuteLoad: number;          // Carga últimos 7 dias (kg)
  chronicLoad: number;        // Carga média últimos 28 dias (kg)
  warnings: string[];
  alternativeExercises?: string[];
  restrictedExercises?: string[];
}

export async function analyzeInjuryRisk(
  userId: string,
  demographicProfile: DemographicProfile,
  exercisesToCheck?: string[]
): Promise<InjuryAssessment> {
  const fourWeeksAgo = Date.now() - 28 * 24 * 3600 * 1000;
  let allSets: SetLog[] = [];
  
  if (exercisesToCheck && exercisesToCheck.length > 0) {
    const setsPromises = exercisesToCheck.map(ex => getRecentSetLogsDecrypted(ex, 200));
    const setsArrays = await Promise.all(setsPromises);
    allSets = setsArrays.flat().filter(s => s.timestamp > fourWeeksAgo);
  } else {
    const allExercises = await getAllExercisesFromHistory();
    const setsPromises = allExercises.map(ex => getRecentSetLogsDecrypted(ex, 200));
    const setsArrays = await Promise.all(setsPromises);
    allSets = setsArrays.flat().filter(s => s.timestamp > fourWeeksAgo);
  }

  if (allSets.length === 0) {
    return {
      overallRisk: 'LOW',
      acwr: 0,
      acuteLoad: 0,
      chronicLoad: 0,
      warnings: ['Sem dados suficientes para análise de risco. Completa mais treinos.'],
    };
  }

  const now = Date.now();
  const acuteStart = now - 7 * 24 * 3600 * 1000;
  const chronicStart = now - 28 * 24 * 3600 * 1000;

  let acuteLoad = 0;
  let chronicLoad = 0;

  for (const set of allSets) {
    const load = set.weightKg * set.repsCompleted;
    if (set.timestamp >= acuteStart) acuteLoad += load;
    if (set.timestamp >= chronicStart) chronicLoad += load;
  }

  const chronicAvg = chronicLoad / 4; 
  const acwr = chronicAvg > 0 ? acuteLoad / chronicAvg : 0;

  let baseRisk: InjuryRisk = 'LOW';
  if (acwr > 1.5) baseRisk = 'CRITICAL';
  else if (acwr > 1.3) baseRisk = 'HIGH';
  else if (acwr > 0.8) baseRisk = 'MODERATE';
  else baseRisk = 'LOW';

  let adjustedRisk = baseRisk;
  if (demographicProfile === 'senior_joint_focus') {
    if (acwr > 1.2 && baseRisk !== 'CRITICAL') adjustedRisk = 'HIGH';
    else if (acwr > 1.0 && baseRisk === 'LOW') adjustedRisk = 'MODERATE';
  }

  const warnings: string[] = [];
  const restrictedExercises: string[] = [];
  const alternativeExercises: string[] = [];

  if (adjustedRisk === 'CRITICAL') {
    warnings.push(`🚨 RISCO CRÍTICO! ACWR = ${acwr.toFixed(2)} – carga das últimas 2 semanas muito acima do normal.`);
    warnings.push('Suspende treinos de alta intensidade por 3-5 dias. Foco em mobilidade e cardio leve.');
    restrictedExercises.push('barbell deadlift', 'barbell back squat', 'box jump', 'burpee', 'sprint');
    alternativeExercises.push('walking', 'stretching', 'yoga', 'foam rolling');
  } else if (adjustedRisk === 'HIGH') {
    warnings.push(`⚠️ Risco elevado (ACWR = ${acwr.toFixed(2)}). Reduz volume em 30% esta semana.`);
    restrictedExercises.push('jump squat', 'clean and jerk');
    alternativeExercises.push('dumbell bench press', 'machine leg press');
  } else if (adjustedRisk === 'MODERATE') {
    warnings.push(`⚖️ Atenção: ACWR = ${acwr.toFixed(2)}. Mantém carga, mas evita picos de intensidade.`);
  } else {
    warnings.push(`✅ Zona doce. ACWR = ${acwr.toFixed(2)}. Progressão segura.`);
  }

  return {
    overallRisk: adjustedRisk,
    acwr: Math.round(acwr * 100) / 100,
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicAvg),
    warnings,
    restrictedExercises,
    alternativeExercises,
  };
}
