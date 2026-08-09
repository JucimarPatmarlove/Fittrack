// @ts-nocheck
// src/services/injuryPredictionEngine.ts
import { getDB, getRecentSetLogsByExercise, getRecoveryMetricsByDateRange } from '../db/schema';

export interface InjuryRiskReport {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number;
  flags: RiskFlag[];
  recommendations: string[];
  affectedMuscleGroups: string[];
  nextReview: string;
}

export interface RiskFlag {
  type:
    | 'volume_spike'
    | 'asymmetry'
    | 'rpe_drift'
    | 'velocity_decay'
    | 'recovery_decline'
    | 'overuse';
  severity: 'warning' | 'alert' | 'critical';
  message: string;
  exerciseName?: string;
  metric: string;
  threshold: string;
}

const ACWR_SAFE_MIN = 0.8;
const ACWR_SAFE_MAX = 1.3;
const ACWR_DANGER = 1.5;
const RPE_DRIFT_THRESHOLD = 0.5;
const VELOCITY_DECAY_THRESHOLD = 15;
const OVERUSE_THRESHOLD = 5;

export async function generateInjuryRiskReport(): Promise<InjuryRiskReport> {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twentyEightDaysAgo = now - 28 * 24 * 60 * 60 * 1000;

  const flags: RiskFlag[] = [];

  const acwrFlags = await analyzeACWR(sevenDaysAgo, twentyEightDaysAgo);
  flags.push(...acwrFlags);

  const rpeFlags = await analyzeRPEDrift(sevenDaysAgo);
  flags.push(...rpeFlags);

  const recoveryFlags = await analyzeRecoveryDecline();
  flags.push(...recoveryFlags);

  const overuseFlags = await analyzeOveruse(sevenDaysAgo);
  flags.push(...overuseFlags);

  const riskScore = calculateOverallRisk(flags);
  const overallRisk = scoreToRiskLevel(riskScore);

  return {
    overallRisk,
    riskScore,
    flags,
    recommendations: generateRecommendations(flags, overallRisk),
    affectedMuscleGroups: extractAffectedGroups(flags),
    nextReview:
      overallRisk === 'critical' ? '24 horas' : overallRisk === 'high' ? '3 dias' : '7 dias',
  };
}

async function analyzeACWR(acuteStart: number, chronicStart: number): Promise<RiskFlag[]> {
  const flags: RiskFlag[] = [];
  const acuteVolume = await calculateVolumeInRange(acuteStart, Date.now());
  const chronicVolume = (await calculateVolumeInRange(chronicStart, Date.now())) / 4;

  if (chronicVolume === 0) return flags;

  const acwr = acuteVolume / chronicVolume;

  if (acwr > ACWR_DANGER) {
    flags.push({
      type: 'volume_spike',
      severity: 'critical',
      message: `Volume de treino aumentou ${((acwr - 1) * 100).toFixed(0)}% esta semana. Risco elevado de overload agudo.`,
      metric: acwr.toFixed(2),
      threshold: `ACWR > ${ACWR_DANGER}`,
    });
  } else if (acwr > ACWR_SAFE_MAX) {
    flags.push({
      type: 'volume_spike',
      severity: 'alert',
      message: `Volume de treino está ${((acwr - 1) * 100).toFixed(0)}% acima do normal. Reduzir 10-15%.`,
      metric: acwr.toFixed(2),
      threshold: `ACWR > ${ACWR_SAFE_MAX}`,
    });
  } else if (acwr < ACWR_SAFE_MIN) {
    flags.push({
      type: 'volume_spike',
      severity: 'warning',
      message: 'Volume de treino abaixo do normal. Possível detraining.',
      metric: acwr.toFixed(2),
      threshold: `ACWR < ${ACWR_SAFE_MIN}`,
    });
  }

  return flags;
}

async function analyzeRPEDrift(since: number): Promise<RiskFlag[]> {
  const flags: RiskFlag[] = [];
  const exercises = ['Barbell Back Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];

  for (const exercise of exercises) {
    const logs = await getRecentSetLogsByExercise(exercise, 30);
    const recentLogs = logs.filter((l) => l.timestamp >= since);

    if (recentLogs.length < 6) continue;
    const weeklyRPE = groupByWeek(
      recentLogs.map((l) => ({ date: l.timestamp, rpe: l.rpe, weight: l.weightKg })),
    );
    if (weeklyRPE.length < 2) continue;

    const avgRPEFirst = weeklyRPE[0].reduce((s, d) => s + d.rpe, 0) / weeklyRPE[0].length;
    const avgRPELast =
      weeklyRPE[weeklyRPE.length - 1].reduce((s, d) => s + d.rpe, 0) /
      weeklyRPE[weeklyRPE.length - 1].length;

    const rpeDrift = avgRPELast - avgRPEFirst;

    if (rpeDrift > RPE_DRIFT_THRESHOLD) {
      flags.push({
        type: 'rpe_drift',
        severity: 'alert',
        message: `RPE em ${exercise} subiu ${rpeDrift.toFixed(1)} com cargas semelhantes.`,
        exerciseName: exercise,
        metric: rpeDrift.toFixed(1),
        threshold: `RPE drift > ${RPE_DRIFT_THRESHOLD}`,
      });
    }
  }
  return flags;
}

async function analyzeRecoveryDecline(): Promise<RiskFlag[]> {
  const flags: RiskFlag[] = [];
  const now = Date.now();
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const hrvMetrics = await getRecoveryMetricsByDateRange(fourteenDaysAgo, now, 'hrv');
  if (hrvMetrics.length < 5) return flags;

  const sorted = hrvMetrics.sort((a, b) => a.timestamp - b.timestamp);
  const firstWeek = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondWeek = sorted.slice(Math.floor(sorted.length / 2));

  const avgFirst = firstWeek.reduce((s, m) => s + m.value, 0) / firstWeek.length;
  const avgSecond = secondWeek.reduce((s, m) => s + m.value, 0) / secondWeek.length;
  const decline = ((avgFirst - avgSecond) / avgFirst) * 100;

  if (decline > 10) {
    flags.push({
      type: 'recovery_decline',
      severity: decline > 20 ? 'critical' : 'alert',
      message: `HRV caiu ${decline.toFixed(1)}% nas últimas 2 semanas.`,
      metric: `${decline.toFixed(1)}%`,
      threshold: 'HRV decline > 10%',
    });
  }
  return flags;
}

async function calculateVolumeInRange(start: number, end: number): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('setLogs', 'readonly');
  const index = tx.store.index('by-timestamp');
  const range = IDBKeyRange.bound(start, end);
  const logs = await index.getAll(range);
  return logs.reduce((sum, l) => sum + l.weightKg * l.repsCompleted, 0);
}

async function analyzeOveruse(since: number): Promise<RiskFlag[]> {
  const flags: RiskFlag[] = [];
  const db = await getDB();
  const tx = db.transaction('setLogs', 'readonly');
  const exercises = await tx.store.index('by-exerciseName').getAllKeys();

  for (const exerciseName of exercises) {
    const range = IDBKeyRange.bound([exerciseName, since], [exerciseName, Date.now()]);
    const logs = await db.getAllFromIndex('setLogs', 'by-exercise-timestamp', range);
    const uniqueWorkouts = new Set(logs.map((l) => l.workoutId)).size;
    if (uniqueWorkouts > OVERUSE_THRESHOLD) {
      flags.push({
        type: 'overuse',
        severity: 'alert',
        message: `Fizeste ${exerciseName} ${uniqueWorkouts} vezes nos últimos 7 dias. Risco de overuse.`,
        exerciseName: String(exerciseName),
        metric: uniqueWorkouts.toString(),
        threshold: `> ${OVERUSE_THRESHOLD}`,
      });
    }
  }
  return flags;
}

function groupByWeek<T extends { date: number }>(data: T[]): T[][] {
  const weeks: T[][] = [];
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  let currentWeek: T[] = [];
  let weekStart = data[0]?.date || Date.now();

  for (const item of data) {
    if (item.date - weekStart > oneWeek) {
      if (currentWeek.length > 0) weeks.push(currentWeek);
      currentWeek = [item];
      weekStart = item.date;
    } else {
      currentWeek.push(item);
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);
  return weeks;
}

function calculateOverallRisk(flags: RiskFlag[]): number {
  if (flags.length === 0) return 10;
  const severityWeights = { warning: 15, alert: 30, critical: 50 };
  let score = 0;
  for (const flag of flags) score += severityWeights[flag.severity];
  if (flags.length >= 3) score += 15;
  if (flags.length >= 5) score += 20;
  return Math.min(100, score);
}

function scoreToRiskLevel(score: number): InjuryRiskReport['overallRisk'] {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

function generateRecommendations(
  flags: RiskFlag[],
  risk: InjuryRiskReport['overallRisk'],
): string[] {
  const recs: string[] = [];
  if (risk === 'critical') {
    recs.push('🛑 PAUSA OBRIGATÓRIA: Não treines hoje. O risco de lesão é extremo.');
    recs.push('Prioriza sono de 8+ horas e hidratação.');
    return recs;
  }
  if (risk === 'high') {
    recs.push('⚠️ REDUZ VOLUME: Corta 30-40% do volume planejado hoje.');
    recs.push('Evita exercícios excêntricos pesados e falha muscular.');
  }
  for (const flag of flags) {
    switch (flag.type) {
      case 'volume_spike':
        recs.push('Implementa deload semanal.');
        break;
      case 'rpe_drift':
        recs.push(`Em ${flag.exerciseName}, reduz séries.`);
        break;
      case 'recovery_decline':
        recs.push('Adiciona 1 dia de descanso ativo.');
        break;
      case 'overuse':
        recs.push('Substitui movimentos padrão por variantes.');
        break;
    }
  }
  return recs;
}

function extractAffectedGroups(flags: RiskFlag[]): string[] {
  const groups = new Set<string>();
  for (const flag of flags) {
    if (flag.exerciseName) {
      const exercise = flag.exerciseName.toLowerCase();
      if (exercise.includes('squat') || exercise.includes('leg'))
        groups.add('Quadríceps / Glúteos');
      if (exercise.includes('deadlift')) groups.add('Posterior Chain');
      if (exercise.includes('bench') || exercise.includes('press')) groups.add('Peito / Ombros');
      if (exercise.includes('row') || exercise.includes('pull')) groups.add('Costas / Bíceps');
    }
  }
  return Array.from(groups);
}

export async function preWorkoutSafetyCheck(): Promise<{
  safe: boolean;
  report: InjuryRiskReport;
  overrideRequired: boolean;
}> {
  const report = await generateInjuryRiskReport();
  return {
    safe: report.overallRisk !== 'critical',
    report,
    overrideRequired: report.overallRisk === 'high' || report.overallRisk === 'critical',
  };
}
