import { create } from 'zustand';
import { healthBridge as HealthBridge, HealthMetrics as DailyBiometrics } from '../services/healthBridge';
import { getEnhancedReadinessScore } from '../services/neuralFatigue';
import { getMasterKey } from '../utils/cryptoEngine';
import { encryptJSON, decryptJSON } from '../utils/cryptoHelpers';
import { getDB } from '../db/schema';

const CACHE_TTL = 60 * 60 * 1000; // 1 hora

interface HealthState {
  biometrics: DailyBiometrics | null;
  readinessScore: number | null;
  readinessLabel: string;
  readinessColor: string;
  clinicalNotes: string[];
  isSyncing: boolean;
  lastSyncTimestamp: number | null;

  // Ações
  syncHealthData: (history: any[], forceRefresh?: boolean) => Promise<void>;
  loadFromEncryptedStorage: () => Promise<void>;
  clearData: () => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  biometrics: null,
  readinessScore: null,
  readinessLabel: '',
  readinessColor: '#6a994e',
  clinicalNotes: [],
  isSyncing: false,
  lastSyncTimestamp: null,

  loadFromEncryptedStorage: async () => {
    try {
      const db = await getDB();
      const stored = await db.get('personalRecords', 'health_biometrics');
      if (stored?.encryptedFields) {
        const key = getMasterKey();
        if (key) {
          const decrypted = await decryptJSON<any>(stored.encryptedFields, key);
          set({
            biometrics: decrypted.biometrics,
            readinessScore: decrypted.readinessScore,
            readinessLabel: decrypted.readinessLabel,
            readinessColor: decrypted.readinessColor,
            clinicalNotes: decrypted.clinicalNotes,
            lastSyncTimestamp: decrypted.lastSyncTimestamp,
          });
        }
      }
    } catch (err) {
      console.warn('[HealthStore] Failed to load encrypted data:', err);
    }
  },

  syncHealthData: async (history: any[], forceRefresh = false) => {
    const now = Date.now();
    const { biometrics, lastSyncTimestamp, loadFromEncryptedStorage } = get();

    if (!biometrics) {
      await loadFromEncryptedStorage();
      const updated = get();
      if (updated.biometrics && updated.lastSyncTimestamp && (now - updated.lastSyncTimestamp) < CACHE_TTL) {
        const result = await getEnhancedReadinessScore(history);
        set({ readinessScore: result.score, readinessLabel: result.label, readinessColor: result.color, clinicalNotes: result.clinicalNotes, isSyncing: false });
        return;
      }
    }

    if (!forceRefresh && biometrics && lastSyncTimestamp && (now - lastSyncTimestamp) < CACHE_TTL) {
      const result = await getEnhancedReadinessScore(history);
      set({ readinessScore: result.score, readinessLabel: result.label, readinessColor: result.color, clinicalNotes: result.clinicalNotes });
      return;
    }

    set({ isSyncing: true });

    try {
      // Force autoSync will update healthBridge state
      const freshSync = await HealthBridge.autoSync();
      const result = await getEnhancedReadinessScore(history);

      const freshBiometrics = freshSync.success ? freshSync.metrics : null;
      
      set({
        biometrics: freshBiometrics,
        readinessScore: result.score,
        readinessLabel: result.label,
        readinessColor: result.color,
        clinicalNotes: result.clinicalNotes,
        lastSyncTimestamp: now,
        isSyncing: false,
      });

      const key = getMasterKey();
      if (key) {
        const encrypted = await encryptJSON({
          biometrics: freshBiometrics,
          readinessScore: result.score,
          readinessLabel: result.label,
          readinessColor: result.color,
          clinicalNotes: result.clinicalNotes,
          lastSyncTimestamp: now,
        }, key);

        const db = await getDB();
        await db.put('personalRecords', {
          exerciseName: 'health_biometrics',
          best1RM: 0,
          bestVolumeWeight: 0,
          lastTrainedAt: now,
          encryptedFields: encrypted,
        } as any);
      }
    } catch (error) {
      console.error('[HealthStore] Sync failed:', error);
      set({ isSyncing: false });
    }
  },

  clearData: () => {
    set({ biometrics: null, readinessScore: null, readinessLabel: '', readinessColor: '#6a994e', clinicalNotes: [], lastSyncTimestamp: null });
  },
}));
