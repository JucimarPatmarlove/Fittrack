// @ts-nocheck
// src/services/keyRotationService.ts
// Serviço de rotação de chave mestra (mudança de PIN).
//
// Implementa uma transação atómica no IndexedDB que:
// 1. Valida o PIN antigo decifrando um registo existente
// 2. Re-cifra TODOS os SetLogs com a nova chave
// 3. Actualiza a chave mestra em memória
//
// Se qualquer passo falhar, a transacção reverte automaticamente
// e os dados ficam intactos com o PIN antigo.

import { getDB } from '../db/schema';
import { deriveKey } from '../utils/cryptoEngine';
import { setMasterKey } from '../utils/cryptoEngine';
import { decryptJSON, encryptJSON } from '../utils/cryptoHelpers';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface RotationResult {
  success: boolean;
  rotatedCount: number; // Número de SetLogs re-cifrados
  skippedCount: number; // SetLogs sem encryptedFields (modo dev)
  message: string;
}

export interface RotationProgress {
  phase: 'validating' | 'deriving' | 'rotating' | 'done' | 'error';
  progress?: number; // 0–100
  message: string;
}

type ProgressCallback = (update: RotationProgress) => void;

// ─── CAMPOS SENSÍVEIS (idêntico ao encryptedDb.ts) ────────────────────────────

interface SensitiveSetFields {
  weightKg: number;
  repsCompleted: number;
  rpe: number;
  estimated1RM: number;
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Rotação atómica da chave mestra.
 *
 * @param oldPin PIN actual (para validação)
 * @param newPin Novo PIN a definir
 * @param onProgress Callback opcional para feedback em tempo real
 * @returns RotationResult com estatísticas da operação
 * @throws Error se o PIN antigo for inválido ou os dados estiverem corrompidos
 */
export async function rotateMasterKey(
  oldPin: string,
  newPin: string,
  onProgress?: ProgressCallback,
): Promise<RotationResult> {
  const report = (phase: RotationProgress['phase'], message: string, progress?: number) => {
    onProgress?.({ phase, message, progress });
  };

  // ── PASSO 1: Validar PINs ──────────────────────────────────────────────────

  if (!oldPin || oldPin.length < 4) {
    throw new Error('PIN antigo deve ter pelo menos 4 caracteres');
  }
  if (!newPin || newPin.length < 4) {
    throw new Error('Novo PIN deve ter pelo menos 4 caracteres');
  }
  if (oldPin === newPin) {
    throw new Error('O novo PIN deve ser diferente do PIN actual');
  }

  // ── PASSO 2: Derivar ambas as chaves ANTES da transacção ──────────────────
  // (O deriveKey usa Web Worker + PBKDF2, não pode estar dentro de IDB tx)

  report('deriving', 'A derivar chaves criptográficas...', 10);

  let oldKey: CryptoKey;
  let newKey: CryptoKey;

  try {
    [oldKey, newKey] = await Promise.all([deriveKey(oldPin), deriveKey(newPin)]);
  } catch (err) {
    throw new Error(
      `Falha na derivação de chave: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
    );
  }

  // ── PASSO 3: Validação prévia com o PIN antigo ────────────────────────────
  // Tenta decifrar o primeiro SetLog cifrado para verificar que o PIN está correcto
  // ANTES de iniciar a transacção destrutiva.

  report('validating', 'A validar PIN antigo...', 20);

  const db = await getDB();
  const firstEncryptedSet = await findFirstEncryptedSet(db);

  if (firstEncryptedSet) {
    try {
      await decryptJSON<SensitiveSetFields>(firstEncryptedSet.encryptedFields!, oldKey);
    } catch {
      throw new Error('PIN antigo inválido ou dados corrompidos. A operação foi cancelada.');
    }
  }
  // Se não há SetLogs cifrados (modo dev / sem dados), continuamos sem validação

  // ── PASSO 4: Transacção atómica de re-cifragem ────────────────────────────

  report('rotating', 'A re-cifrar os dados com o novo PIN...', 35);

  let rotatedCount = 0;
  let skippedCount = 0;

  try {
    const tx = db.transaction('setLogs', 'readwrite');
    const store = tx.store;

    const allSets = await store.getAll();
    const totalSets = allSets.length;

    const updatedSets = [];

    for (let i = 0; i < allSets.length; i++) {
      const set = allSets[i];

      // Actualizar progresso (35% a 90%)
      const progressPct = 35 + Math.floor((i / totalSets) * 55);
      if (i % 10 === 0) {
        report('rotating', `A re-cifrar série ${i + 1}/${totalSets}...`, progressPct);
      }

      if (!set.encryptedFields) {
        // Modo dev ou série não cifrada — manter como está
        skippedCount++;
        continue;
      }

      // Decifrar com chave antiga
      const sensitive = await decryptJSON<SensitiveSetFields>(set.encryptedFields, oldKey);

      // Re-cifrar com nova chave
      const newEncryptedFields = await encryptJSON(sensitive, newKey);

      updatedSets.push({
        ...set,
        encryptedFields: newEncryptedFields,
      });
      rotatedCount++;
    }

    // Escrever todos de uma vez (operação atómica dentro da transacção)
    for (const updated of updatedSets) {
      await store.put(updated);
    }

    await tx.done;
  } catch (err) {
    // A transacção reverte automaticamente quando lançamos um erro
    const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';

    // Se é erro de PIN inválido durante a re-cifragem (não deverá acontecer,
    // pois já validámos acima, mas por segurança):
    if (errMsg.includes('Invalid PIN') || errMsg.includes('corrupted')) {
      throw new Error('PIN antigo inválido. Os dados não foram alterados.');
    }

    throw new Error(`Falha na rotação de chave: ${errMsg}. Os dados originais foram preservados.`);
  }

  // ── PASSO 5: Actualizar chave mestra em memória ────────────────────────────

  report('done', 'A actualizar sessão...', 95);
  setMasterKey(newKey);

  report('done', `Rotação concluída! ${rotatedCount} séries re-cifradas.`, 100);

  return {
    success: true,
    rotatedCount,
    skippedCount,
    message: `PIN alterado com sucesso. ${rotatedCount} série(s) re-cifrada(s), ${skippedCount} ignorada(s) (sem cifragem).`,
  };
}

// ─── HELPER: Encontrar primeiro SetLog cifrado ────────────────────────────────

async function findFirstEncryptedSet(db: Awaited<ReturnType<typeof getDB>>) {
  const tx = db.transaction('setLogs', 'readonly');
  let cursor = await tx.store.openCursor();

  while (cursor) {
    if (cursor.value.encryptedFields) {
      return cursor.value;
    }
    cursor = await cursor.continue();
  }

  return null; // Sem dados cifrados (modo dev)
}
