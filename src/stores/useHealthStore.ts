// @ts-nocheck
// src/stores/useHealthStore.ts
// Store central de dados biométricos — Integra HealthKit (peso RENPHO + sono Apple Watch)
// com o motor de ajuste dinâmico interdiário e o sistema de readiness existente.

import { create } from 'zustand';
import { healthKit, HealthKitData } from '../services/healthKitService';
import { healthBridge as HealthBridge, UnifiedHealthMetrics } from '../services/healthBridge';
import { calculateDailyAdjustments, DailyAdjustment, BiometricContext } from '../utils/dailyAdjustment';
import { getEnhancedReadinessScore } from '../services/neuralFatigue';
import { getMasterKey } from '../utils/cryptoEngine';
import { encryptJSON, decryptJSON } from '../utils/cryptoHelpers';
import { getDB } from '../db/schema';

const CACHE_TTL = 60 * 60 * 1000; // 1 hora

interface HealthState {
  // ── Dados legados (ReadinessGauge / ClinicalAnalytics) ──
  biometrics: DailyBiometrics | null;
  readinessScore: number | null;
  readinessLabel: string;
  readinessColor: string;
  clinicalNotes: string[];

  // ── Novos dados HealthKit (Telemetria Biológica) ──
  healthKitData: UnifiedHealthMetrics | null;
  dailyAdjustment: DailyAdjustment | null;

  // ── Estado de sincronização ──
  isSyncing: boolean;
  lastSyncTimestamp: number | null;

  // ── Ações ──
  syncHealthData: (history: any[], forceRefresh?: boolean) => Promise<void>;
  syncHealthKit: (history?: any[], meals?: any[], profile?: any) => Promise<void>;
  loadFromEncryptedStorage: () => Promise<void>;
  clearData: () => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  // Estado inicial — legado
  biometrics: null,
  readinessScore: null,
  readinessLabel: '',
  readinessColor: '#6a994e',
  clinicalNotes: [],

  // Estado inicial — HealthKit
  healthKitData: null,
  dailyAdjustment: null,

  // Sincronização
  isSyncing: false,
  lastSyncTimestamp: null,

  // ─── LOAD ENCRIPTADO ─────────────────────────────────────────────────────

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
            // Restaurar dados HealthKit do cache encriptado
            healthKitData: decrypted.healthKitData || null,
            dailyAdjustment: decrypted.dailyAdjustment || null,
          });
        }
      }
    } catch (err) {
      console.warn('[HealthStore] Failed to load encrypted data:', err);
    }
  },

  // ─── SYNC LEGADO (ReadinessGauge + ClinicalAnalytics) ─────────────────────

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
      // O syncHealthData legado já não recebe biometrics assim, pois HealthBridge mudou para UnifiedHealthMetrics.
      // Vamos ignorar a parte do freshBiometrics para o Readiness por agora e usar o HealthBridge.autoSync
      const freshSync = await HealthBridge.autoSync();
      const result = await getEnhancedReadinessScore(history);
      // biometrics é legado, vamos mantê-lo como null
      const freshBiometrics = null;

      set({
        biometrics: freshBiometrics,
        readinessScore: result.score,
        readinessLabel: result.label,
        readinessColor: result.color,
        clinicalNotes: result.clinicalNotes,
        lastSyncTimestamp: now,
        isSyncing: false,
      });

      // Persistir encriptado
      const key = getMasterKey();
      if (key) {
        const encrypted = await encryptJSON({
          biometrics: freshBiometrics,
          readinessScore: result.score,
          readinessLabel: result.label,
          readinessColor: result.color,
          clinicalNotes: result.clinicalNotes,
          lastSyncTimestamp: now,
          healthKitData: get().healthKitData,
          dailyAdjustment: get().dailyAdjustment,
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

  // ─── SYNC HEALTHKIT (Telemetria Biológica — RENPHO + Apple Watch) ─────────

  syncHealthKit: async (history: any[] = [], meals: any[] = [], profile: any = {}) => {
    set({ isSyncing: true });

    try {
      // 1. Autorizar e sincronizar (Agora via HealthBridge dual mode)
      const healthData = await HealthBridge.autoSync();

      // 2. Calcular dados do dia anterior para análise interdiária
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Calorias consumidas ontem (do array de meals do NutritionStore)
      let yesterdayConsumed = 0;
      if (Array.isArray(meals)) {
        const yesterdayMeal = meals.find((m: any) => m.date === yesterdayStr);
        if (yesterdayMeal) {
          const allItems = [
            ...(yesterdayMeal.breakfast || []),
            ...(yesterdayMeal.lunch || []),
            ...(yesterdayMeal.snack || []),
            ...(yesterdayMeal.dinner || []),
          ];
          yesterdayConsumed = allItems.reduce((sum: number, item: any) => sum + (item.calories || 0), 0);
        }
      }

      // Calorias gastas ontem (do array de history do workouts)
      let yesterdayBurned = 0;
      if (Array.isArray(history)) {
        const yesterdayWorkouts = history.filter((w: any) =>
          w.date === yesterdayStr || w.startTime?.startsWith(yesterdayStr)
        );
        yesterdayBurned = yesterdayWorkouts.reduce(
          (sum: number, w: any) => sum + (w.totalCalories || w.caloriesBurned || 0), 0
        );
      }

      // 3. Construir contexto biométrico
      const baselineWeight = profile?.weight || 75;
      const targetCalories = profile?.targetCalories || 2300;

      const ctx: BiometricContext = {
        currentWeight: healthData.weight ?? baselineWeight,
        sleepHours: healthData.sleepHours ?? 7,
        yesterdayCaloriesBurned: yesterdayBurned,
        yesterdayCaloriesConsumed: yesterdayConsumed,
        baselineWeight,
        targetCalories,
      };

      // 4. Calcular ajuste dinâmico
      const adjustment = calculateDailyAdjustments(ctx);

      set({
        healthKitData: healthData,
        dailyAdjustment: adjustment,
        isSyncing: false,
      });

      // 5. Persistir no cache encriptado
      try {
        const key = getMasterKey();
        if (key) {
          const state = get();
          const encrypted = await encryptJSON({
            biometrics: state.biometrics,
            readinessScore: state.readinessScore,
            readinessLabel: state.readinessLabel,
            readinessColor: state.readinessColor,
            clinicalNotes: state.clinicalNotes,
            lastSyncTimestamp: Date.now(),
            healthKitData: healthData,
            dailyAdjustment: adjustment,
          }, key);

          const db = await getDB();
          await db.put('personalRecords', {
            exerciseName: 'health_biometrics',
            best1RM: 0,
            bestVolumeWeight: 0,
            lastTrainedAt: Date.now(),
            encryptedFields: encrypted,
          } as any);
        }
      } catch {
        // Encriptação falhou — dados permanecem em memória
      }

    } catch (error) {
      console.error('[HealthStore] HealthKit sync failed:', error);
      set({ isSyncing: false });
    }
  },

  // ─── CLEAR ────────────────────────────────────────────────────────────────

  clearData: () => {
    set({
      biometrics: null,
      readinessScore: null,
      readinessLabel: '',
      readinessColor: '#6a994e',
      clinicalNotes: [],
      healthKitData: null,
      dailyAdjustment: null,
      lastSyncTimestamp: null,
    });
  },
}));
