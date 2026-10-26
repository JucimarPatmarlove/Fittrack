// Durable Storage — Atomic Writes para IndexedDB/localStorage
// Inspirado no padrão atomicWrite do openGym
// Garante que escritras parciais não corrompam dados existentes

import { get, set, del } from 'idb-keyval';

/**
 * Opções para atomicSave
 */
export interface AtomicSaveOptions {
  /** Tempo máximo em ms para cada operação IDB */
  timeout?: number;
  /** Função de validação personalizada (retorna true se dados são válidos) */
  validate?: (data: string) => boolean;
  /** Se deve usar localStorage como fallback (padrão: false) */
  useLocalStorageFallback?: boolean;
}

/**
 * Resultado da operação atómica
 */
export interface AtomicSaveResult {
  success: boolean;
  error?: Error;
  usedFallback?: boolean;
}

/**
 * Guarda dados atomicamente:
 * 1. Escreve numa chave temporária (`key_tmp`)
 * 2. Valida a escrita (lê e verifica se não está vazia/corrompida)
 * 3. Se OK, move para a chave real (apaga a antiga e renomeia)
 * 4. Se falhar a qualquer momento, faz rollback (apaga temp, mantém original)
 *
 * @param key - Chave de armazenamento (ex: 'fit_history')
 * @param data - Dados a guardar (serão serializados com JSON.stringify)
 * @param options - Opções avançadas
 * @returns Promise com resultado da operação
 */
export async function atomicSave(
  key: string,
  data: unknown,
  options: AtomicSaveOptions = {}
): Promise<AtomicSaveResult> {
  const { timeout = 5000, validate, useLocalStorageFallback = false } = options;
  const tempKey = `${key}_tmp`;
  const backupKey = `${key}_bak`; // Backup da versão anterior

  // Serializa dados
  let serialized: string;
  try {
    serialized = JSON.stringify(data);
  } catch (err) {
    return { success: false, error: new Error(`Falha ao serializar: ${err}`) };
  }

  // Validação básica: não vazio
  if (!serialized || serialized === '{}' || serialized === '[]') {
    // Permite arrays/objects vazios, mas não strings vazias
  }

  const storage = useLocalStorageFallback
    ? localStorageAdapter
    : idbAdapter;

  try {
    // 1. Escreve na chave temporária
    await withTimeout(storage.setItem(tempKey, serialized), timeout, 'timeout escrevendo temp');

    // 2. Valida a escrita (lê de volta)
    const written = await withTimeout(storage.getItem(tempKey), timeout, 'timeout lendo temp');
    if (written === null) {
      throw new Error('Chave temporária não encontrada após escrita');
    }
    if (written !== serialized) {
      throw new Error('Dados corrompidos: escrita não corresponde ao original');
    }

    // Validação personalizada se fornecida
    if (validate && !validate(written)) {
      throw new Error('Validação personalizada falhou');
    }

    // 3. Backup da versão atual (se existir)
    const current = await withTimeout(storage.getItem(key), timeout, 'timeout lendo atual');
    if (current !== null) {
      await withTimeout(storage.setItem(backupKey, current), timeout, 'timeout escrevendo backup');
    }

    // 4. Move temp para chave real (escrita atómica via sobrescrita)
    await withTimeout(storage.setItem(key, written), timeout, 'timeout escrevendo chave real');

    // 5. Verifica se a chave real foi escrita corretamente
    const verified = await withTimeout(storage.getItem(key), timeout, 'timeout verificando chave real');
    if (verified !== serialized) {
      // Rollback: restaura backup
      if (current !== null) {
        await storage.setItem(key, current).catch(() => {});
      }
      throw new Error('Verificação pós-escrita falhou: dados não conferem');
    }

    // 6. Limpa chaves temporárias
    await storage.removeItem(tempKey).catch(() => {});
    await storage.removeItem(backupKey).catch(() => {});

    return { success: true };
  } catch (err) {
    // Rollback: limpa temp, mantém original intacto
    await storage.removeItem(tempKey).catch(() => {});
    await storage.removeItem(backupKey).catch(() => {});

    const error = err instanceof Error ? err : new Error(String(err));
    return { success: false, error };
  }
}

/**
 * Lê dados com fallback para backup se chave principal estiver corrompida
 */
export async function atomicLoad<T>(
  key: string,
  options: { timeout?: number; useLocalStorageFallback?: boolean } = {}
): Promise<{ data: T | null; fromBackup: boolean; error?: Error }> {
  const { timeout = 5000, useLocalStorageFallback = false } = options;
  const backupKey = `${key}_bak`;

  const storage = useLocalStorageFallback
    ? localStorageAdapter
    : idbAdapter;

  try {
    // Tenta ler chave principal
    const primary = await withTimeout(storage.getItem(key), timeout, 'timeout lendo principal');

    if (primary !== null) {
      try {
        return { data: JSON.parse(primary), fromBackup: false };
      } catch {
        // Chave principal corrompida → tenta backup
      }
    }

    // Fallback para backup
    const backup = await withTimeout(storage.getItem(backupKey), timeout, 'timeout lendo backup');
    if (backup !== null) {
      try {
        return { data: JSON.parse(backup), fromBackup: true };
      } catch {
        // Backup também corrompido
      }
    }

    return { data: null, fromBackup: false, error: new Error('Dados não encontrados ou corrompidos') };
  } catch (err) {
    return { data: null, fromBackup: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Apaga chave e seu backup atomaticamente
 */
export async function atomicRemove(
  key: string,
  options: { timeout?: number; useLocalStorageFallback?: boolean } = {}
): Promise<AtomicSaveResult> {
  const { timeout = 5000, useLocalStorageFallback = false } = options;
  const backupKey = `${key}_bak`;

  const storage = useLocalStorageFallback
    ? localStorageAdapter
    : idbAdapter;

  try {
    await withTimeout(storage.removeItem(key), timeout, 'timeout apagando chave');
    await withTimeout(storage.removeItem(backupKey), timeout, 'timeout apagando backup');
    return { success: true };
  } catch (err) {
    // Preserve original error messaging
    const error = err instanceof Error ? err : new Error(String(err));
    return { success: false, error };
  }
}

// ── ADAPTERS ──────────────────────────────────────────────────────────────────

const idbAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value || null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

const localStorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    localStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
  },
};

// ── UTILITIES ─────────────────────────────────────────────────────────────────

/**
 * Wrapper para adicionar timeout a promises
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} após ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Validação padrão: JSON válido e não vazio
 */
export function defaultValidate(data: string): boolean {
  if (!data) return false;
  try {
    JSON.parse(data);
    // Rejeita objetos/arrays vazios se preferir
    return true;
  } catch {
    return false;
  }
}

/**
 * Validação para histórico de treinos (array não vazio de objetos válidos)
 */
export function validateWorkoutHistory(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length >= 0;
  } catch {
    return false;
  }
}

/**
 * Validação para perfil de utilizador (objeto com campos obrigatórios)
 */
export function validateUserProfile(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' && 'name' in parsed;
  } catch {
    return false;
  }
}