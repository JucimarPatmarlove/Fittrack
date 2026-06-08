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

// ─── RE-EXPORTS ──────────────────────────────────────────────────────────────

export {
  getPersonalRecord,
  getAllPersonalRecords,
  getAllWorkouts,
  getAllExercisesFromHistory,
  generateId,
};
