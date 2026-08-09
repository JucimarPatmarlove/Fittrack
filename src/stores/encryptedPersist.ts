import type { StateStorage } from 'zustand/middleware';
import { idbStorage } from '../lib/persistence';
import { decryptData, encryptData, getMasterKey } from '../utils/cryptoEngine';

// ─── NOMES DAS STORES IDB ────────────────────────────────────────────────────
// Cada store Zustand cifrada é guardada no IDB sob uma chave com este prefixo.
// Assim não conflitua com os objectStores relacionais (workouts, setLogs, etc.)
const IDB_STORE_NAME = 'fittrack_zustand_encrypted';
const IDB_DB_NAME = 'FitTrack_V7_ZustandStore';
const IDB_VERSION = 1;

// ─── IDB LIGHTWEIGHT WRAPPER (sem depender do schema.ts principal) ───────────
// Usamos um IDB separado para as stores Zustand para não misturar schemas.

let _db: IDBDatabase | null = null;

async function getZustandDB(): Promise<IDBDatabase> {
  if (_db) return _db;

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };

    req.onsuccess = (event) => {
      _db = (event.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await getZustandDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const req = tx.objectStore(IDB_STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await getZustandDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const req = tx.objectStore(IDB_STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbRemove(key: string): Promise<void> {
  const db = await getZustandDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const req = tx.objectStore(IDB_STORE_NAME).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── STORAGE ADAPTER ─────────────────────────────────────────────────────────

/**
 * Cria um StorageValue compatível com Zustand persist.
 * Usa AES-GCM se masterKey estiver activa, localStorage como fallback.
 */
export function createEncryptedStorage(): StateStorage {
  return {
    async getItem(name: string): Promise<string | null> {
      const key = getMasterKey();

      if (!key) {
        // Fallback: idb-keyval em claro
        return await idbStorage.getItem(name);
      }

      try {
        const encrypted = await idbGet(name);
        if (!encrypted) return null;
        return await decryptData(key, encrypted);
      } catch (err) {
        console.warn(`[EncryptedPersist] Falha ao decifrar "${name}":`, err);
        // Dados corrompidos ou PIN errado → tratar como vazio
        return null;
      }
    },

    async setItem(name: string, value: string): Promise<void> {
      const key = getMasterKey();

      if (!key) {
        await idbStorage.setItem(name, value);
        return;
      }

      try {
        const encrypted = await encryptData(key, value);
        await idbSet(name, encrypted);
        // Limpar idb se havia entrada em claro (migração)
        await idbStorage.removeItem(name);
        localStorage.removeItem(name);
      } catch (err) {
        console.error(`[EncryptedPersist] Falha ao cifrar "${name}":`, err);
        // Fallback seguro: não gravar nada em vez de gravar em claro
        throw err;
      }
    },

    async removeItem(name: string): Promise<void> {
      await idbRemove(name);
      await idbStorage.removeItem(name);
      localStorage.removeItem(name); // limpar todos os backends
    },
  };
}

// ─── MIGRAÇÃO AUTOMÁTICA ─────────────────────────────────────────────────────

/**
 * Chamada uma vez quando o utilizador activa o PIN pela primeira vez.
 * Lê todas as stores Zustand do localStorage e cifra-as no IDB.
 */
export async function migrateLocalStorageToEncrypted(
  key: CryptoKey,
  storeNames: string[],
): Promise<{ migrated: string[]; skipped: string[] }> {
  const migrated: string[] = [];
  const skipped: string[] = [];

  for (const name of storeNames) {
    const plaintext = localStorage.getItem(name);
    if (!plaintext) {
      skipped.push(name);
      continue;
    }

    try {
      const encrypted = await encryptData(key, plaintext);
      await idbSet(name, encrypted);
      localStorage.removeItem(name);
      migrated.push(name);
    } catch (err) {
      console.error(`[EncryptedPersist] Migração falhou para "${name}":`, err);
      skipped.push(name);
    }
  }

  console.info(
    `[EncryptedPersist] Migração: ${migrated.length} cifradas, ${skipped.length} ignoradas.`,
  );
  return { migrated, skipped };
}

// ─── LISTA DE STORES SENSÍVEIS ────────────────────────────────────────────────
// Importa e passa para migrateLocalStorageToEncrypted() após PIN activo.

export const SENSITIVE_STORE_NAMES = [
  'progression-store', // histórico de successo/falha por exercício
  'effort-store', // pontos de esforço semanal
  'milestones-store', // cache de PRs
  'ghost-store', // performance histórica (Ghost Mode)
  'challenge-store', // desafios activos
  'plan-store', // plano semanal
  'routine-store', // rotinas guardadas
] as const;

export type SensitiveStoreName = (typeof SENSITIVE_STORE_NAMES)[number];
