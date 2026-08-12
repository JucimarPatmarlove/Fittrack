// @ts-nocheck
// src/services/recoveryEngine.ts
import { type RecoveryMetric, getDB } from '../db/schema';

export interface ReadinessSnapshot {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  hrvTrend: 'improving' | 'stable' | 'declining' | 'no_data';
  sleepQuality: number; // 0-100
  fatigueIndex: number; // 0-100 (0 = fresco, 100 = exausto)
  muscleSoreness: number; // 0-100
  recommendation: string;
  trainingAdjustment: {
    loadModifier: number; // Multiplicador de carga (0.5 = -50%)
    volumeModifier: number; // Multiplicador de volume
    maxRPE: number; // RPE máximo recomendado
    suggestedFocus: string; // Tipo de treino recomendado
  };
}

export async function calculateReadinessScore(_userId?: string): Promise<ReadinessSnapshot> {
  const { getRecoveryMetricsByDateRange } = await import('../db/schema');
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

  const [hrvMetrics, sleepMetrics, sorenessMetrics, moodMetrics] = await Promise.all([
    getRecoveryMetricsByDateRange(sevenDaysAgo, now, 'hrv'),
    getRecoveryMetricsByDateRange(threeDaysAgo, now, 'sleep'),
    getRecoveryMetricsByDateRange(threeDaysAgo, now, 'soreness'),
    getRecoveryMetricsByDateRange(threeDaysAgo, now, 'mood'),
  ]);

  const hrvScore = calculateHRVComponent(hrvMetrics);
  const sleepScore = calculateSleepComponent(sleepMetrics);
  const fatigueScore = await calculateFatigueComponent();
  const sorenessScore = calculateSorenessComponent(sorenessMetrics);
  const moodScore = calculateMoodComponent(moodMetrics);

  const rawScore =
    hrvScore * 0.3 +
    sleepScore * 0.25 +
    (100 - fatigueScore) * 0.25 +
    sorenessScore * 0.15 +
    moodScore * 0.05;

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  const status = getStatusFromScore(score);
  const trainingAdjustment = getTrainingAdjustment(score, fatigueScore, sorenessScore);

  return {
    score,
    status,
    hrvTrend: calculateHRVTrend(hrvMetrics),
    sleepQuality: sleepScore,
    fatigueIndex: fatigueScore,
    muscleSoreness: 100 - sorenessScore,
    recommendation: generateRecommendation(score, status, trainingAdjustment),
    trainingAdjustment,
  };
}

function calculateHRVComponent(metrics: RecoveryMetric[]): number {
  if (metrics.length === 0) return 70;
  const sorted = metrics.sort((a, b) => a.timestamp - b.timestamp);
  const latest = sorted[sorted.length - 1].value;
  const baseline =
    sorted.length >= 7
      ? sorted.slice(-7).reduce((s, m) => s + m.value, 0) / 7
      : sorted.reduce((s, m) => s + m.value, 0) / sorted.length;

  const ratio = baseline > 0 ? latest / baseline : 1;

  if (ratio > 1.1) return 95;
  if (ratio > 1.0) return 85;
  if (ratio > 0.95) return 75;
  if (ratio > 0.9) return 60;
  if (ratio > 0.85) return 45;
  return 30;
}

function calculateHRVTrend(metrics: RecoveryMetric[]): ReadinessSnapshot['hrvTrend'] {
  if (metrics.length < 3) return 'no_data';
  const sorted = metrics.sort((a, b) => a.timestamp - b.timestamp);
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  const avgFirst = firstHalf.reduce((s, m) => s + m.value, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, m) => s + m.value, 0) / secondHalf.length;
  const change = (avgSecond - avgFirst) / avgFirst;
  if (change > 0.05) return 'improving';
  if (change < -0.05) return 'declining';
  return 'stable';
}

function calculateSleepComponent(metrics: RecoveryMetric[]): number {
  if (metrics.length === 0) return 70;
  const latest = metrics[metrics.length - 1].value;
  if (latest >= 8) return 95;
  if (latest >= 7) return 85;
  if (latest >= 6) return 70;
  if (latest >= 5) return 50;
  if (latest >= 4) return 30;
  return 15;
}

async function calculateFatigueComponent(): Promise<number> {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twentyEightDaysAgo = now - 28 * 24 * 60 * 60 * 1000;

  const db = await getDB();
  const tx = db.transaction('setLogs', 'readonly');
  const index = tx.store.index('by-timestamp');

  const acuteRange = IDBKeyRange.bound(sevenDaysAgo, now);
  const chronicRange = IDBKeyRange.bound(twentyEightDaysAgo, sevenDaysAgo);

  const acuteLogs = await index.getAll(acuteRange);
  const chronicLogs = await index.getAll(chronicRange);

  const acuteVolume = acuteLogs.reduce((sum, l) => sum + l.weightKg * l.repsCompleted, 0);
  const chronicAvgVolume = chronicLogs.length
    ? chronicLogs.reduce((sum, l) => sum + l.weightKg * l.repsCompleted, 0) / 4
    : 15000;

  const ratio = chronicAvgVolume > 0 ? acuteVolume / chronicAvgVolume : 1;
  let fatigue = 50;
  if (ratio > 1.5) fatigue = 85;
  else if (ratio > 1.3) fatigue = 75;
  else if (ratio > 1.1) fatigue = 65;
  else if (ratio < 0.7) fatigue = 30;
  else fatigue = 50;

  return Math.min(100, Math.max(0, fatigue));
}

function calculateSorenessComponent(metrics: RecoveryMetric[]): number {
  if (metrics.length === 0) return 70;
  const latest = metrics[metrics.length - 1].value;
  return Math.max(0, 100 - latest * 10);
}

function calculateMoodComponent(metrics: RecoveryMetric[]): number {
  if (metrics.length === 0) return 70;
  const latest = metrics[metrics.length - 1].value;
  return latest * 10;
}

function getStatusFromScore(score: number): ReadinessSnapshot['status'] {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'moderate';
  if (score >= 40) return 'poor';
  return 'critical';
}

function getTrainingAdjustment(
  score: number,
  _fatigue: number,
  _soreness: number,
): ReadinessSnapshot['trainingAdjustment'] {
  if (score >= 85) {
    return {
      loadModifier: 1.05,
      volumeModifier: 1.0,
      maxRPE: 9,
      suggestedFocus: 'Força máxima ou teste de PR',
    };
  }
  if (score >= 70) {
    return {
      loadModifier: 1.0,
      volumeModifier: 1.0,
      maxRPE: 8.5,
      suggestedFocus: 'Treino normal com progressão',
    };
  }
  if (score >= 55) {
    return {
      loadModifier: 0.9,
      volumeModifier: 0.85,
      maxRPE: 8,
      suggestedFocus: 'Volume moderado, técnica e controlo',
    };
  }
  if (score >= 40) {
    return {
      loadModifier: 0.75,
      volumeModifier: 0.7,
      maxRPE: 7,
      suggestedFocus: 'Recuperação ativa ou mobilidade',
    };
  }
  return {
    loadModifier: 0.5,
    volumeModifier: 0.5,
    maxRPE: 6,
    suggestedFocus: 'Descanso completo — prioriza sono e nutrição',
  };
}

function generateRecommendation(
  score: number,
  status: ReadinessSnapshot['status'],
  _adjustment: ReadinessSnapshot['trainingAdjustment'],
): string {
  const messages: Record<ReadinessSnapshot['status'], string[]> = {
    excellent: [
      'O teu corpo está pronto para o máximo. Aproveita para testar limites!',
      'Recuperação ótima. Hoje é dia de PRs.',
      'Sistema nervoso central fresco. Carga pesada com confiança.',
    ],
    good: [
      'Boa forma física. Mantém a progressão planeada.',
      'Recuperação positiva. Podes aumentar ligeiramente a carga.',
    ],
    moderate: [
      'Recuperação moderada. Reduz volume em 15% e foca na técnica.',
      'O teu SNC precisa de atenção. Evita falha muscular hoje.',
    ],
    poor: [
      'Fadiga acumulada detectada. Treino de recuperação ativa recomendado.',
      'O teu corpo pede descanso. Considera mobilidade e sono extra.',
    ],
    critical: [
      '⚠️ Risco de overtraining. Descanso obrigatório.',
      'O teu readiness score está crítico. Prioriza recuperação sobre tudo.',
    ],
  };
  const list = messages[status];
  return list[Math.floor(Math.random() * list.length)];
}

export async function logHRV(
  value: number,
  source: RecoveryMetric['source'] = 'manual',
): Promise<void> {
  const { addRecoveryMetric } = await import('../db/schema');
  await addRecoveryMetric({ date: Date.now(), type: 'hrv', value, source, timestamp: Date.now() });
}

export async function logSleep(hours: number, quality?: number): Promise<void> {
  const { addRecoveryMetric } = await import('../db/schema');
  await addRecoveryMetric({
    date: Date.now(),
    type: 'sleep',
    value: hours,
    source: 'manual',
    notes: quality ? `Qualidade: ${quality}/10` : undefined,
    timestamp: Date.now(),
  });
}

export async function logSoreness(level: number, muscleGroup?: string): Promise<void> {
  const { addRecoveryMetric } = await import('../db/schema');
  await addRecoveryMetric({
    date: Date.now(),
    type: 'soreness',
    value: level,
    source: 'manual',
    notes: muscleGroup,
    timestamp: Date.now(),
  });
}

export async function logMood(level: number): Promise<void> {
  const { addRecoveryMetric } = await import('../db/schema');
  await addRecoveryMetric({
    date: Date.now(),
    type: 'mood',
    value: level,
    source: 'manual',
    timestamp: Date.now(),
  });
}
