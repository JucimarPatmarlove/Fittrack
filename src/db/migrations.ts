// @ts-nocheck
// src/db/migrations.ts
import { IDBPDatabase } from 'idb';
import { FitTrackDBSchema } from './schema';

export const CURRENT_DB_VERSION = 3;

interface Migration {
  version: number;
  name: string;
  up: (db: IDBPDatabase<FitTrackDBSchema>) => void | Promise<void>;
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
    up: (db) => {
      if (!db.objectStoreNames.contains('recoveryMetrics')) {
        const store = db.createObjectStore('recoveryMetrics', { keyPath: 'id' });
        store.createIndex('by-date', 'date');
        store.createIndex('by-type', 'type');
        store.createIndex('by-date-type', ['date', 'type']);
      }
      const workoutStore = db.transaction('workouts', 'readwrite').objectStore('workouts');
      if (!workoutStore.indexNames.contains('by-name')) {
        workoutStore.createIndex('by-name', 'name');
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
];

export async function runMigrations(
  db: IDBPDatabase<FitTrackDBSchema>,
  oldVersion: number,
  newVersion: number
): Promise<void> {
  for (const m of migrations) {
    if (m.version > oldVersion && m.version <= newVersion) {
      console.log(`[Migration v${m.version}] ${m.name}`);
      await m.up(db);
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
  const expected = ['workouts', 'setLogs', 'personalRecords', 'recoveryMetrics', 'meals', 'hydration', 'weightHistory'];
  const missing = expected.filter((s: string) => !db.objectStoreNames.contains(s as any));
  return {
    healthy: missing.length === 0,
    currentVersion: db.version,
    expectedVersion: CURRENT_DB_VERSION,
    missingStores: missing,
  };
}

