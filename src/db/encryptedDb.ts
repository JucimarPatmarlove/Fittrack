// src/db/encryptedDb.ts
// Camada de criptografia transparente sobre o IndexedDB.
// Cifra campos sensíveis (weightKg, repsCompleted, rpe, estimated1RM) com AES-GCM
// usando a chave derivada do PIN do utilizador.
//
// Campos de índice (id, workoutId, exerciseName, timestamp) ficam em claro
// para permitir queries eficientes.

import {
  SetLog,
  WorkoutSession,
  PersonalRecord,
  addSetLog as rawAddSetLog,
  addWorkoutSession as rawAddWorkoutSession,
  getSetLogsByWorkout as rawGetSetLogsByWorkout,
  getRecentSetLogsByExercise as rawGetRecentSetLogsByExercise,
  upsertPersonalRecord as rawUpsertPersonalRecord,
  getPersonalRecord,
  getAllPersonalRecords,
  getAllWorkouts,
  getAllUniqueExercises as getAllExercisesFromHistory,
  generateId,
} from './schema';
import { getMasterKey } from '../utils/cryptoEngine';
import { encryptJSON, decryptJSON } from '../utils/cryptoHelpers';

// ─── CAMPOS SENSÍVEIS ────────────────────────────────────────────────────────

interface SensitiveSetFields {
  weightKg: number;
  repsCompleted: number;
  rpe: number;
  estimated1RM: number;
}

// ─── OPERAÇÕES CIFRADAS: SetLog ──────────────────────────────────────────────

/**
 * Guarda um SetLog no IndexedDB.
 * Se existir uma chave mestra (após login com PIN), cifra os campos sensíveis.
 * Caso contrário, guarda em texto claro (modo desenvolvimento).
 */
export async function saveSetLog(setLog: Omit<SetLog, 'id'>): Promise<string> {
  const key = getMasterKey();

  if (!key) {
    // Sem chave — modo desenvolvimento, guarda em claro
    return rawAddSetLog(setLog);
  }

  // Extrair campos sensíveis para cifrar
  const sensitiveFields: SensitiveSetFields = {
    weightKg: setLog.weightKg,
    repsCompleted: setLog.repsCompleted,
    rpe: setLog.rpe,
    estimated1RM: setLog.estimated1RM,
  };

  // Cifrar os campos sensíveis num payload único
  const encryptedPayload = await encryptJSON(sensitiveFields, key);

  // Gravar com campos sensíveis zerados e o payload cifrado
  const encryptedSetLog: Omit<SetLog, 'id'> = {
    ...setLog,
    weightKg: 0,        // Zerado — dados reais no encryptedFields
    repsCompleted: 0,
    rpe: 0,
    estimated1RM: 0,
    encryptedFields: encryptedPayload,
  };

  return rawAddSetLog(encryptedSetLog);
}

/**
 * Lê e decifra os SetLogs de um treino específico.
 * Se os dados estiverem cifrados, decifra com a chave mestra.
 */
export async function getSetLogsDecrypted(workoutId: string): Promise<SetLog[]> {
  const key = getMasterKey();
  const rawLogs = await rawGetSetLogsByWorkout(workoutId);

  if (!key) return rawLogs; // Sem chave — dados já em claro

  const decrypted: SetLog[] = [];
  for (const log of rawLogs) {
    if (log.encryptedFields) {
      try {
        const sensitive = await decryptJSON<SensitiveSetFields>(log.encryptedFields, key);
        decrypted.push({
          ...log,
          weightKg: sensitive.weightKg,
          repsCompleted: sensitive.repsCompleted,
          rpe: sensitive.rpe,
          estimated1RM: sensitive.estimated1RM,
        });
      } catch (e) {
        console.warn('[EncryptedDB] Falha ao decifrar SetLog:', log.id, e);
        decrypted.push(log); // Retorna como está se falhar
      }
    } else {
      decrypted.push(log); // Dados em claro (legacy/dev)
    }
  }

  return decrypted;
}

/**
 * Lê e decifra os SetLogs recentes de um exercício.
 * Usado pelo trendAnalyzer para analisar tendências.
 */
export async function getRecentSetLogsDecrypted(exerciseName: string, limit = 50): Promise<SetLog[]> {
  const key = getMasterKey();
  const rawLogs = await rawGetRecentSetLogsByExercise(exerciseName, limit);

  if (!key) return rawLogs;

  const decrypted: SetLog[] = [];
  for (const log of rawLogs) {
    if (log.encryptedFields) {
      try {
        const sensitive = await decryptJSON<SensitiveSetFields>(log.encryptedFields, key);
        decrypted.push({
          ...log,
          weightKg: sensitive.weightKg,
          repsCompleted: sensitive.repsCompleted,
          rpe: sensitive.rpe,
          estimated1RM: sensitive.estimated1RM,
        });
      } catch (e) {
        console.warn('[EncryptedDB] Falha ao decifrar SetLog:', log.id, e);
        decrypted.push(log);
      }
    } else {
      decrypted.push(log);
    }
  }

  return decrypted;
}

// ─── OPERAÇÕES CIFRADAS: WorkoutSession ──────────────────────────────────────

/**
 * Cria uma nova sessão de treino no IndexedDB.
 * WorkoutSession não tem campos sensíveis — guarda em claro.
 */
export async function saveWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<string> {
  return rawAddWorkoutSession(session);
}

// ─── OPERAÇÕES: PersonalRecords ──────────────────────────────────────────────

/**
 * Actualiza o recorde pessoal de um exercício.
 */
export async function updatePersonalRecord(
  exerciseName: string,
  estimated1RM: number,
  weightKg: number,
  repsCompleted: number
): Promise<void> {
  const pr: PersonalRecord = {
    exerciseName,
    best1RM: estimated1RM,
    bestVolumeWeight: repsCompleted >= 10 ? weightKg : 0,
    lastTrainedAt: Date.now(),
  };

  await rawUpsertPersonalRecord(pr);
}

// ─── OPERAÇÕES CIFRADAS: Nutrição e Saúde ──────────────────────────────────────

import {
  DailyMealLog,
  HydrationLog,
  WeightLog,
  getDailyMealLog as rawGetDailyMealLog,
  upsertDailyMealLog as rawUpsertDailyMealLog,
  getHydrationLog as rawGetHydrationLog,
  upsertHydrationLog as rawUpsertHydrationLog,
  getWeightLog as rawGetWeightLog,
  upsertWeightLog as rawUpsertWeightLog,
  getAllWeightLogs as rawGetAllWeightLogs,
} from './schema';

export async function saveDailyMealLog(log: Omit<DailyMealLog, 'encryptedFields'>): Promise<void> {
  const key = getMasterKey();
  if (!key) return rawUpsertDailyMealLog(log);

  const sensitive = {
    breakfast: log.breakfast,
    lunch: log.lunch,
    snack: log.snack,
    dinner: log.dinner,
  };
  const encryptedPayload = await encryptJSON(sensitive, key);

  await rawUpsertDailyMealLog({
    date: log.date,
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: [],
    encryptedFields: encryptedPayload,
  });
}

export async function getDailyMealLogDecrypted(date: string): Promise<DailyMealLog | undefined> {
  const key = getMasterKey();
  const rawLog = await rawGetDailyMealLog(date);
  if (!rawLog) return undefined;
  if (!key || !rawLog.encryptedFields) return rawLog;

  try {
    const sensitive = await decryptJSON<Omit<DailyMealLog, 'date' | 'encryptedFields'>>(rawLog.encryptedFields, key);
    return { ...rawLog, ...sensitive };
  } catch (e) {
    console.warn('[EncryptedDB] Falha ao decifrar DailyMealLog:', rawLog.date, e);
    return rawLog;
  }
}

export async function saveHydrationLog(log: Omit<HydrationLog, 'encryptedFields'>): Promise<void> {
  const key = getMasterKey();
  if (!key) return rawUpsertHydrationLog(log);

  const sensitive = { mlConsumed: log.mlConsumed };
  const encryptedPayload = await encryptJSON(sensitive, key);

  await rawUpsertHydrationLog({
    date: log.date,
    mlConsumed: 0,
    encryptedFields: encryptedPayload,
  });
}

export async function getHydrationLogDecrypted(date: string): Promise<HydrationLog | undefined> {
  const key = getMasterKey();
  const rawLog = await rawGetHydrationLog(date);
  if (!rawLog) return undefined;
  if (!key || !rawLog.encryptedFields) return rawLog;

  try {
    const sensitive = await decryptJSON<{ mlConsumed: number }>(rawLog.encryptedFields, key);
    return { ...rawLog, mlConsumed: sensitive.mlConsumed };
  } catch (e) {
    console.warn('[EncryptedDB] Falha ao decifrar HydrationLog:', rawLog.date, e);
    return rawLog;
  }
}

export async function saveWeightLog(log: Omit<WeightLog, 'encryptedFields'>): Promise<void> {
  const key = getMasterKey();
  if (!key) return rawUpsertWeightLog(log);

  const sensitive = { weight: log.weight };
  const encryptedPayload = await encryptJSON(sensitive, key);

  await rawUpsertWeightLog({
    date: log.date,
    weight: 0,
    encryptedFields: encryptedPayload,
  });
}

export async function getWeightLogDecrypted(date: string): Promise<WeightLog | undefined> {
  const key = getMasterKey();
  const rawLog = await rawGetWeightLog(date);
  if (!rawLog) return undefined;
  if (!key || !rawLog.encryptedFields) return rawLog;

  try {
    const sensitive = await decryptJSON<{ weight: number }>(rawLog.encryptedFields, key);
    return { ...rawLog, weight: sensitive.weight };
  } catch (e) {
    console.warn('[EncryptedDB] Falha ao decifrar WeightLog:', rawLog.date, e);
    return rawLog;
  }
}

export async function getAllWeightLogsDecrypted(): Promise<WeightLog[]> {
  const key = getMasterKey();
  const rawLogs = await rawGetAllWeightLogs();
  
  if (!key) return rawLogs;

  const decrypted: WeightLog[] = [];
  for (const log of rawLogs) {
    if (log.encryptedFields) {
      try {
        const sensitive = await decryptJSON<{ weight: number }>(log.encryptedFields, key);
        decrypted.push({ ...log, weight: sensitive.weight });
      } catch (e) {
        decrypted.push(log);
      }
    } else {
      decrypted.push(log);
    }
  }
  return decrypted;
}

// ─── RE-EXPORTS ──────────────────────────────────────────────────────────────

export {
  getPersonalRecord,
  getAllPersonalRecords,
  getAllWorkouts,
  getAllExercisesFromHistory,
  generateId,
};
