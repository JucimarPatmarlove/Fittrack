// src/services/gamificationEngine.ts
import { getDB } from '../db/schema';
import type { WorkoutSession, SetLog, PersonalRecord } from '../db/schema';

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0, title: 'Iniciante' },
  { level: 2, xpRequired: 500, title: 'Praticante' },
  { level: 3, xpRequired: 1500, title: 'Atleta Amador' },
  { level: 4, xpRequired: 3000, title: 'Guerreiro do Ferro' },
  { level: 5, xpRequired: 6000, title: 'Veterano' },
  { level: 6, xpRequired: 10000, title: 'Mestre da Força' },
  { level: 7, xpRequired: 16000, title: 'Elite' },
  { level: 8, xpRequired: 25000, title: 'Lenda Viva' },
];

export interface XPEvent {
  amount: number;
  reason: string;
}

export function getCurrentLevel(xp: number): LevelThreshold {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xpRequired) {
      return LEVEL_THRESHOLDS[i];
    }
  }
  return LEVEL_THRESHOLDS[0];
}

export async function calculateWorkoutXP(workoutId: string): Promise<XPEvent[]> {
  const db = await getDB();
  const session = await db.get('workouts', workoutId);
  const sets = await db.getAllFromIndex('setLogs', 'by-workoutId', workoutId);
  const events: XPEvent[] = [];

  if (!session || sets.length === 0) return events;

  const baseXP = Math.floor(session.durationSeconds / 60) * 1; 
  events.push({ amount: baseXP, reason: 'Tempo de treino' });

  // Fallback to the old logic if effortScore is missing (legacy workouts)
  const effortScore = session.effortScore ?? sets.reduce((sum, s) => sum + (s.weightKg * s.repsCompleted), 0);
  const effortXP = Math.floor(effortScore / 100) * 5; 
  if (effortXP > 0) events.push({ amount: effortXP, reason: 'Esforço de Treino (Effort Score)' });

  const hardSets = sets.filter(s => s.rpe >= 8).length;
  if (hardSets > 0) events.push({ amount: hardSets * 2, reason: 'Séries difíceis (RPE 8+)' });

  if (session.isCompleted) {
    events.push({ amount: 50, reason: 'Treino concluído' });
  }

  const newPRs = await detectPRs(sets);
  if (newPRs > 0) {
    events.push({ amount: newPRs * 100, reason: `Novos Recordes Pessoais (${newPRs})` });
  }

  return events;
}

async function detectPRs(sets: SetLog[]): Promise<number> {
  const db = await getDB();
  let prCount = 0;
  const bestPerExercise = new Map<string, number>();

  for (const set of sets) {
    const currentBest = bestPerExercise.get(set.exerciseName) || 0;
    if (set.estimated1RM > currentBest) {
      bestPerExercise.set(set.exerciseName, set.estimated1RM);
    }
  }

  for (const [exercise, sessionMax] of bestPerExercise.entries()) {
    const pr = await db.get('personalRecords', exercise);
    if (!pr || sessionMax > pr.best1RM) {
      prCount++;
    }
  }

  return prCount;
}

export async function detectNewExercises(workoutId: string): Promise<string[]> {
  const db = await getDB();
  const sets = await db.getAllFromIndex('setLogs', 'by-workoutId', workoutId);
  const uniqueExercises = new Set(sets.map(s => s.exerciseName));
  const newExercises: string[] = [];

  for (const exercise of uniqueExercises) {
    const range = IDBKeyRange.bound([exercise, 0], [exercise, Date.now()]);
    const previousLogs = await db.getAllFromIndex('setLogs', 'by-exercise-timestamp', range);
    const hasPrevious = previousLogs.some(l => l.workoutId !== workoutId);
    if (!hasPrevious) {
      newExercises.push(exercise);
    }
  }

  return newExercises;
}

export async function syncUserStats(currentXP: number, workoutId: string): Promise<{
  newTotalXP: number;
  levelUp: boolean;
  events: XPEvent[];
  newLevel?: LevelThreshold;
}> {
  const currentLevelInfo = getCurrentLevel(currentXP);
  const events = await calculateWorkoutXP(workoutId);
  const gainedXP = events.reduce((sum, e) => sum + e.amount, 0);
  const newTotalXP = currentXP + gainedXP;
  
  const newLevelInfo = getCurrentLevel(newTotalXP);
  const levelUp = newLevelInfo.level > currentLevelInfo.level;

  return {
    newTotalXP,
    levelUp,
    events,
    newLevel: levelUp ? newLevelInfo : undefined,
  };
}
