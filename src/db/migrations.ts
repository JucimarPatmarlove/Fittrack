// @ts-nocheck
// src/db/migrations.ts
import type { IDBPDatabase, IDBTransaction } from 'idb';
import type { FitTrackDBSchema } from './schema';

export const CURRENT_DB_VERSION = 4;

interface Migration {
  version: number;
  name: string;
  up: (db: IDBPDatabase<FitTrackDBSchema>, transaction?: IDBTransaction) => void | Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'Schema inicial',
    up: () => {},
  },
  {
    version: 2,
    name: 'Adiciona recoveryMetrics e índices',
    up: (db, transaction) => {
      if (!db.objectStoreNames.contains('recoveryMetrics')) {
        const store = db.createObjectStore('recoveryMetrics', { keyPath: 'id' });
        store.createIndex('by-date', 'date');
        store.createIndex('by-type', 'type');
        store.createIndex('by-date-type', ['date', 'type']);
      }
      // During upgrade, use the transaction to access existing stores
      if (transaction && db.objectStoreNames.contains('workouts')) {
        try {
          const workoutStore = transaction.objectStore('workouts');
          if (!workoutStore.indexNames.contains('by-name')) {
            workoutStore.createIndex('by-name', 'name');
          }
        } catch (e) {
          // Index might already exist or store not accessible
          console.warn('[Migration v2] Could not add by-name index:', e);
        }
      }
    },
  },
  {
    version: 3,
    name: 'Adiciona meals, hydration, weightHistory',
    up: (db) => {
      if (!db.objectStoreNames.contains('meals')) {
        db.createObjectStore('meals', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('hydration')) {
        db.createObjectStore('hydration', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('weightHistory')) {
        db.createObjectStore('weightHistory', { keyPath: 'date' });
      }
    },
  },
  {
    version: 4,
    name: 'Adiciona keyval store para Zustand persist',
    up: (db) => {
      if (!db.objectStoreNames.contains('keyval')) {
        db.createObjectStore('keyval');
      }
    },
  },
];

export async function runMigrations(
  db: IDBPDatabase<FitTrackDBSchema>,
  oldVersion: number,
  newVersion: number,
  transaction?: IDBTransaction,
): Promise<void> {
  for (const m of migrations) {
    const shouldRun = m.version > oldVersion && m.version <= newVersion;
    if (shouldRun) {
      console.log(`[Migration v${m.version}] ${m.name}`);
      try {
        await m.up(db, transaction);
      } catch (e) {
        console.error(`[Migration v${m.version}] FAILED:`, e);
        throw e;
      }
    }
  }
}

export async function checkSchemaHealth(): Promise<{
  healthy: boolean;
  currentVersion: number;
  expectedVersion: number;
  missingStores: string[];
}> {
  const { getDB } = await import('./schema');
  const db = await getDB();
  const expected = [
    'workouts',
    'setLogs',
    'personalRecords',
    'recoveryMetrics',
    'meals',
    'hydration',
    'weightHistory',
    'keyval',
  ];
  const missing = expected.filter((s: string) => !db.objectStoreNames.contains(s as any));
  return {
    healthy: missing.length === 0,
    currentVersion: db.version,
    expectedVersion: CURRENT_DB_VERSION,
    missingStores: missing,
  };
}