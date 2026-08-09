// src/db/schema.ts
// Base de dados relacional IndexedDB para o FitTrack V7
// Usa a biblioteca 'idb' (já instalada) como wrapper tipado sobre o IndexedDB nativo.

import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import { CURRENT_DB_VERSION, runMigrations } from './migrations';

// ─── INTERFACES DOS MODELOS ──────────────────────────────────────────────────

/** Sessão de treino (visão macro) */
export interface WorkoutSession {
  id: string; // UUID gerado localmente
  date: number; // Timestamp (fácil para ordenar)
  name: string; // Ex: "Treino Push (Força)"
  durationSeconds: number; // Tempo total do treino
  readinessScore: number; // Fadiga neural antes de começar (0-100)
  totalVolumeKg: number; // Somatório do peso levantado
  effortScore?: number; // NOVO: Esforço normalizado para XP justo (Cardio/Bodyweight)
  avgRPE?: number; // RPE médio do treino
  isCompleted: boolean;
  sleepHours?: number;
  stressLevel?: number; // 1-10 auto-reportado
  preWorkoutRPE?: number; // Perceived readiness
}

/** Registo de séries (onde a IA vai buscar os dados reais) */
export interface SetLog {
  id: string; // UUID
  workoutId: string; // Ligação à sessão
  exerciseName: string; // Ex: "Barbell Back Squat"
  category: string; // Ex: "compound_multi"
  setNumber: number; // Ex: 1, 2, 3...
  weightKg: number; // Carga utilizada
  repsCompleted: number; // Repetições reais feitas
  rpe: number; // Esforço sentido (1-10)
  estimated1RM: number; // Cálculo automático (peso * (1 + reps/30))
  timestamp: number;
  tempoSeconds?: number; // Tempo sob tensão
  rangeOfMotion?: number; // % de ROM completo (MediaPipe)
  barVelocity?: number; // Velocidade média da barra (m/s)
  encryptedFields?: string; // Payload cifrado AES-GCM (substitui weightKg/repsCompleted/rpe/estimated1RM)
}

/** Cache de recordes pessoais (para leitura ultra-rápida na UI) */
export interface PersonalRecord {
  exerciseName: string; // Primary Key
  best1RM: number; // Maior 1RM estimado de sempre
  bestVolumeWeight: number; // Maior carga levantada para 10+ reps
  lastTrainedAt: number; // Data da última vez que fez este exercício
  encryptedFields?: string; // Payload cifrado (usado também para Avaliações Físicas)
  streakWeeks?: number; // Semanas consecutivas com este exercício
  totalSessions?: number; // Total de sessões com este exercício
}

/** NOVO: Métricas de recuperação (HRV, sono, fadiga) */
export interface RecoveryMetric {
  id: string;
  date: number;
  type: 'hrv' | 'sleep' | 'readiness' | 'soreness' | 'mood';
  value: number;
  source: 'manual' | 'bluetooth' | 'apple_health' | 'google_fit';
  notes?: string;
  timestamp: number;
}

/** NUTRIÇÃO: Item de Refeição */
export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
}

/** NUTRIÇÃO: Registo Diário de Refeições */
export interface DailyMealLog {
  date: string; // YYYY-MM-DD
  breakfast: MealItem[];
  lunch: MealItem[];
  snack: MealItem[];
  dinner: MealItem[];
  encryptedFields?: string; // Para Zero Trust
}

/** NUTRIÇÃO: Hidratação Diária */
export interface HydrationLog {
  date: string; // YYYY-MM-DD
  mlConsumed: number;
  encryptedFields?: string; // Para Zero Trust
}

/** NUTRIÇÃO: Histórico de Peso Corporal */
export interface WeightLog {
  date: string; // YYYY-MM-DD
  weight: number; // kg
  encryptedFields?: string; // Para Zero Trust
}

// ─── SCHEMA DO INDEXEDDB ─────────────────────────────────────────────────────

export interface FitTrackDBSchema extends DBSchema {
  workouts: {
    key: string;
    value: WorkoutSession;
    indexes: {
      'by-date': number;
      'by-completed': string;
      'by-name': string;
    };
  };
  setLogs: {
    key: string;
    value: SetLog;
    indexes: {
      'by-workoutId': string;
      'by-exerciseName': string;
      'by-timestamp': number;
      'by-exercise-timestamp': [string, number];
    };
  };
  personalRecords: {
    key: string;
    value: PersonalRecord;
    indexes: {
      'by-lastTrained': number;
    };
  };
  recoveryMetrics: {
    key: string;
    value: RecoveryMetric;
    indexes: {
      'by-date': number;
      'by-type': string;
      'by-date-type': [number, string];
    };
  };
  meals: {
    key: string;
    value: DailyMealLog;
  };
  hydration: {
    key: string;
    value: HydrationLog;
  };
  weightHistory: {
    key: string;
    value: WeightLog;
  };
}

// ─── SINGLETON DA BASE DE DADOS ──────────────────────────────────────────────

const DB_NAME = 'FitTrack_V7_Database';

let dbInstance: IDBPDatabase<FitTrackDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<FitTrackDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FitTrackDBSchema>(DB_NAME, CURRENT_DB_VERSION, {
    async upgrade(db, oldVersion, newVersion) {
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('by-date', 'date');
        workoutStore.createIndex('by-completed', 'isCompleted');
      }
      if (!db.objectStoreNames.contains('setLogs')) {
        const setLogStore = db.createObjectStore('setLogs', { keyPath: 'id' });
        setLogStore.createIndex('by-workoutId', 'workoutId');
        setLogStore.createIndex('by-exerciseName', 'exerciseName');
        setLogStore.createIndex('by-timestamp', 'timestamp');
        setLogStore.createIndex('by-exercise-timestamp', ['exerciseName', 'timestamp']);
      }
      if (!db.objectStoreNames.contains('personalRecords')) {
        const prStore = db.createObjectStore('personalRecords', { keyPath: 'exerciseName' });
        prStore.createIndex('by-lastTrained', 'lastTrainedAt');
      }

      await runMigrations(db, oldVersion, newVersion || CURRENT_DB_VERSION);
    },
  });

  return dbInstance;
}

// ─── OPERAÇÕES CRUD BÁSICAS ──────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Workouts ──
export async function addWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<string> {
  const db = await getDB();
  const id = generateId();
  const record: WorkoutSession = { ...session, id };
  await db.put('workouts', record);
  return id;
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
  const db = await getDB();
  return db.get('workouts', id);
}

export async function getAllWorkouts(): Promise<WorkoutSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('workouts', 'by-date');
}

// ── SetLogs ──
export async function addSetLog(setLog: Omit<SetLog, 'id'>): Promise<string> {
  const db = await getDB();
  const id = generateId();
  const record: SetLog = { ...setLog, id };
  await db.put('setLogs', record);
  return id;
}

export async function getSetLogsByWorkout(workoutId: string): Promise<SetLog[]> {
  const db = await getDB();
  return db.getAllFromIndex('setLogs', 'by-workoutId', workoutId);
}

export async function getSetLogsByExercise(exerciseName: string): Promise<SetLog[]> {
  const db = await getDB();
  return db.getAllFromIndex('setLogs', 'by-exerciseName', exerciseName);
}

export async function getRecentSetLogsByExercise(
  exerciseName: string,
  limit = 50,
): Promise<SetLog[]> {
  const db = await getDB();
  const tx = db.transaction('setLogs', 'readonly');
  const index = tx.store.index('by-exercise-timestamp');
  const range = IDBKeyRange.bound([exerciseName, 0], [exerciseName, Number.MAX_SAFE_INTEGER]);
  const results: SetLog[] = [];
  let cursor = await index.openCursor(range, 'prev');
  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }
  return results;
}

// ── PersonalRecords ──
export async function getPersonalRecord(exerciseName: string): Promise<PersonalRecord | undefined> {
  const db = await getDB();
  return db.get('personalRecords', exerciseName);
}

export async function upsertPersonalRecord(pr: PersonalRecord): Promise<void> {
  const db = await getDB();
  const existing = await db.get('personalRecords', pr.exerciseName);
  if (!existing) {
    await db.put('personalRecords', pr);
    return;
  }
  const updated: PersonalRecord = {
    exerciseName: pr.exerciseName,
    best1RM: Math.max(existing.best1RM, pr.best1RM),
    bestVolumeWeight: Math.max(existing.bestVolumeWeight, pr.bestVolumeWeight),
    lastTrainedAt: Math.max(existing.lastTrainedAt, pr.lastTrainedAt),
    streakWeeks: pr.streakWeeks || existing.streakWeeks,
    totalSessions: (existing.totalSessions || 0) + (pr.totalSessions || 1),
  };
  await db.put('personalRecords', updated);
}

export async function getAllPersonalRecords(): Promise<PersonalRecord[]> {
  const db = await getDB();
  return db.getAll('personalRecords');
}

export async function getAllUniqueExercises(): Promise<string[]> {
  const db = await getDB();
  const keys = await db.getAllKeysFromIndex('setLogs', 'by-exerciseName');
  return Array.from(new Set(keys));
}

// ── RecoveryMetrics ──
export async function addRecoveryMetric(metric: Omit<RecoveryMetric, 'id'>): Promise<string> {
  const db = await getDB();
  const id = generateId();
  const record: RecoveryMetric = { ...metric, id };
  await db.put('recoveryMetrics', record);
  return id;
}

export async function getRecoveryMetricsByDateRange(
  startDate: number,
  endDate: number,
  type?: RecoveryMetric['type'],
): Promise<RecoveryMetric[]> {
  const db = await getDB();
  if (type) {
    const tx = db.transaction('recoveryMetrics', 'readonly');
    const index = tx.store.index('by-date-type');
    const range = IDBKeyRange.bound([startDate, type], [endDate, type]);
    return index.getAll(range);
  }
  const tx = db.transaction('recoveryMetrics', 'readonly');
  const index = tx.store.index('by-date');
  const range = IDBKeyRange.bound(startDate, endDate);
  return index.getAll(range);
}

export async function getLatestRecoveryMetric(
  type: RecoveryMetric['type'],
): Promise<RecoveryMetric | undefined> {
  const db = await getDB();
  const tx = db.transaction('recoveryMetrics', 'readonly');
  const index = tx.store.index('by-type');
  const allOfType = await index.getAll(type);
  if (allOfType.length === 0) return undefined;
  return allOfType.sort((a, b) => b.timestamp - a.timestamp)[0];
}

// ── Nutrição e Saúde ──
export async function getDailyMealLog(date: string): Promise<DailyMealLog | undefined> {
  const db = await getDB();
  return db.get('meals', date);
}

export async function upsertDailyMealLog(log: DailyMealLog): Promise<void> {
  const db = await getDB();
  await db.put('meals', log);
}

export async function getHydrationLog(date: string): Promise<HydrationLog | undefined> {
  const db = await getDB();
  return db.get('hydration', date);
}

export async function upsertHydrationLog(log: HydrationLog): Promise<void> {
  const db = await getDB();
  await db.put('hydration', log);
}

export async function getWeightLog(date: string): Promise<WeightLog | undefined> {
  const db = await getDB();
  return db.get('weightHistory', date);
}

export async function upsertWeightLog(log: WeightLog): Promise<void> {
  const db = await getDB();
  await db.put('weightHistory', log);
}

export async function getAllWeightLogs(): Promise<WeightLog[]> {
  const db = await getDB();
  return db.getAll('weightHistory');
}

export { generateId };
