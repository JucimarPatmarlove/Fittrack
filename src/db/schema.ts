// src/db/schema.ts
// Base de dados relacional IndexedDB para o FitTrack V7
// Usa a biblioteca 'idb' (já instalada) como wrapper tipado sobre o IndexedDB nativo.

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ─── INTERFACES DOS MODELOS ──────────────────────────────────────────────────

/** Sessão de treino (visão macro) */
export interface WorkoutSession {
  id: string;                // UUID gerado localmente
  date: number;              // Timestamp (fácil para ordenar)
  name: string;              // Ex: "Treino Push (Força)"
  durationSeconds: number;   // Tempo total do treino
  readinessScore: number;    // Fadiga neural antes de começar (0-100)
  totalVolumeKg: number;     // Somatório do peso levantado
  isCompleted: boolean;
}

/** Registo de séries (onde a IA vai buscar os dados reais) */
export interface SetLog {
  id: string;                // UUID
  workoutId: string;         // Ligação à sessão
  exerciseName: string;      // Ex: "Barbell Back Squat"
  category: string;          // Ex: "compound_multi"
  setNumber: number;         // Ex: 1, 2, 3...
  weightKg: number;          // Carga utilizada
  repsCompleted: number;     // Repetições reais feitas
  rpe: number;               // Esforço sentido (1-10)
  estimated1RM: number;      // Cálculo automático (peso * (1 + reps/30))
  timestamp: number;
  // Campo para dados cifrados (quando criptografia activa)
  encryptedFields?: string;  // Payload cifrado AES-GCM (substitui weightKg/repsCompleted/rpe/estimated1RM)
}

/** Cache de recordes pessoais (para leitura ultra-rápida na UI) */
export interface PersonalRecord {
  exerciseName: string;      // Primary Key
  best1RM: number;           // Maior 1RM estimado de sempre
  bestVolumeWeight: number;  // Maior carga levantada para 10+ reps
  lastTrainedAt: number;     // Data da última vez que fez este exercício
  encryptedFields?: string;  // Payload cifrado (usado também para Avaliações Físicas)
}

// ─── SCHEMA DO INDEXEDDB ─────────────────────────────────────────────────────

interface FitTrackDBSchema extends DBSchema {
  workouts: {
    key: string;
    value: WorkoutSession;
    indexes: {
      'by-date': number;
      'by-completed': string; // IDB não suporta boolean como índice, usamos string 'true'/'false'
    };
  };
  setLogs: {
    key: string;
    value: SetLog;
    indexes: {
      'by-workoutId': string;
      'by-exerciseName': string;
      'by-timestamp': number;
      'by-exercise-timestamp': [string, number]; // índice composto para queries eficientes
    };
  };
  personalRecords: {
    key: string;
    value: PersonalRecord;
    indexes: {
      'by-lastTrained': number;
    };
  };
}

// ─── SINGLETON DA BASE DE DADOS ──────────────────────────────────────────────

const DB_NAME = 'FitTrack_V7_Database';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<FitTrackDBSchema> | null = null;

/**
 * Obtém a instância singleton da base de dados.
 * Inicializa na primeira chamada, reutiliza nas seguintes.
 */
export async function getDB(): Promise<IDBPDatabase<FitTrackDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FitTrackDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // ── Workouts Store ──
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('by-date', 'date');
        workoutStore.createIndex('by-completed', 'isCompleted');
      }

      // ── SetLogs Store ──
      if (!db.objectStoreNames.contains('setLogs')) {
        const setLogStore = db.createObjectStore('setLogs', { keyPath: 'id' });
        setLogStore.createIndex('by-workoutId', 'workoutId');
        setLogStore.createIndex('by-exerciseName', 'exerciseName');
        setLogStore.createIndex('by-timestamp', 'timestamp');
        setLogStore.createIndex('by-exercise-timestamp', ['exerciseName', 'timestamp']);
      }

      // ── PersonalRecords Store ──
      if (!db.objectStoreNames.contains('personalRecords')) {
        const prStore = db.createObjectStore('personalRecords', { keyPath: 'exerciseName' });
        prStore.createIndex('by-lastTrained', 'lastTrainedAt');
      }
    },
  });

  return dbInstance;
}

// ─── OPERAÇÕES CRUD BÁSICAS ──────────────────────────────────────────────────

/** Gerar UUID compatível com todos os browsers */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para browsers sem crypto.randomUUID
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

export async function getRecentSetLogsByExercise(exerciseName: string, limit = 50): Promise<SetLog[]> {
  const db = await getDB();
  const tx = db.transaction('setLogs', 'readonly');
  const index = tx.store.index('by-exercise-timestamp');
  
  // IDBKeyRange para filtrar por exerciseName (qualquer timestamp)
  const range = IDBKeyRange.bound(
    [exerciseName, 0],
    [exerciseName, Number.MAX_SAFE_INTEGER]
  );
  
  const results: SetLog[] = [];
  let cursor = await index.openCursor(range, 'prev'); // 'prev' = mais recentes primeiro
  
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
  
  // Só actualiza se for melhor
  const updated: PersonalRecord = {
    exerciseName: pr.exerciseName,
    best1RM: Math.max(existing.best1RM, pr.best1RM),
    bestVolumeWeight: Math.max(existing.bestVolumeWeight, pr.bestVolumeWeight),
    lastTrainedAt: Math.max(existing.lastTrainedAt, pr.lastTrainedAt),
  };
  
  await db.put('personalRecords', updated);
}

export async function getAllPersonalRecords(): Promise<PersonalRecord[]> {
  const db = await getDB();
  return db.getAll('personalRecords');
}

export { generateId };
