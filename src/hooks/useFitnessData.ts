// src/hooks/useFitnessData.ts
// Hook customizado que encapsula toda a lógica de persistência, XP e feedback do App.tsx
// Resultado da refatoração: App.tsx fica responsável apenas pela navegação e renderização.

import { useCallback, useEffect, useState } from 'react';
import type { WorkoutSession } from '../db/schema';
import { checkForNewerBackup, importEncryptedBackup } from '../services/backupService';
import { syncUserStats } from '../services/gamificationEngine';
import { downloadBackup } from '../services/googleDrive';
import { PredictiveChallenges } from '../services/predictiveChallenges';
import type { UserProfile, WorkoutPlan } from '../types';
import { initAudio } from '../utils/audio';
import { getMasterKey, setMasterKey } from '../utils/cryptoEngine';
import { HistorySchema, ProfileSchema } from '../utils/schemas';
import { useLS } from './index';

export type ViewName =
  | 'dashboard'
  | 'workout'
  | 'settings'
  | 'assessment'
  | 'guide'
  | 'feedback'
  | 'history'
  | 'aicoach'
  | 'trends'
  | 'planner'
  | 'gymvibe'
  | 'milestones'
  | 'cyclereview'
  | 'nutrition'
  | 'devices'
  | 'rewards'
  | 'backup'
  | 'walkingcoach'
  | 'community'
  | 'compete'
  | 'recovery';

interface PendingBackup {
  id: string;
  name: string;
  createdTime: string;
}

// ---- Utility functions extracted from the hook ----

/** Check for backup availability and session state */
async function checkBackupAvailability(): Promise<PendingBackup | null> {
  try {
    return await checkForNewerBackup();
  } catch {
    return null;
  }
}

/** Check if session was previously unlocked */
function checkSessionUnlock(): boolean {
  const sessionUnlocked = sessionStorage.getItem('fittrack_session_unlocked') === 'true';
  return sessionUnlocked && getMasterKey() !== null;
}

/** Auto-backup: store snapshot in IDB once per 24h */
async function performSilentBackup(): Promise<void> {
  const lastBackup = localStorage.getItem('last_backup');
  if (lastBackup && Date.now() - Number.parseInt(lastBackup) <= 24 * 60 * 60 * 1000) return;

  try {
    const { get, set } = await import('idb-keyval');
    const profileData = (await get('fit_profile')) || localStorage.getItem('fit_profile');
    const historyData = await get('fit_history');
    const ghostData = (await get('ghost-storage')) || localStorage.getItem('ghost-storage');

    await set('cloud_backup_mock', {
      profile: profileData || null,
      history: historyData || null,
      ghostStats: ghostData || null,
      timestamp: Date.now(),
    });

    localStorage.setItem('last_backup', Date.now().toString());
    console.log('AutoBackup: Snapshot (IDB-source) guardado.');
  } catch {
    // Silent fail for backup
  }
}

/** Check IndexedDB integrity on session resume */
async function checkDatabaseIntegrity(): Promise<void> {
  try {
    const { getDB } = await import('../db/schema');
    const db = await getDB();
    const count = await db.count('personalRecords');
    if (count === 0 && sessionStorage.getItem('fittrack_session_unlocked') === 'true') {
      console.warn('[App] IndexedDB vazia. O navegador limpou a base de dados.');
    }
  } catch {
    // Silently ignore
  }
}

/** Evaluate and update challenge completions */
function updateChallengesFromWorkout(
  workoutData: WorkoutSession,
  newHistory: WorkoutSession[],
): void {
  try {
    const storedC = localStorage.getItem('fit_challenges');
    if (!storedC) return;

    let challenges = JSON.parse(storedC);
    let updated = false;

    challenges = challenges.map((c: any) => {
      if (
        c.status === 'active' &&
        PredictiveChallenges.evaluateChallenge(c, workoutData, newHistory)
      ) {
        c.status = 'completed';
        updated = true;
      }
      return c;
    });

    if (updated) localStorage.setItem('fit_challenges', JSON.stringify(challenges));
  } catch {
    // Silently ignore challenge errors
  }
}

/** Sync XP with gamification engine and handle level ups */
async function syncXPAndCheckLevelUp(
  currentXP: number,
  workoutId: string | undefined,
  setProfile: (updater: (prev: UserProfile) => UserProfile) => void,
): Promise<void> {
  try {
    const stats = await syncUserStats(currentXP, workoutId || '');
    setProfile((p: UserProfile) => ({ ...p, xp: stats.newTotalXP }));
    if (stats.levelUp) {
      alert(
        `🏆 PARABÉNS! Subiste para o nível ${stats.newLevel?.level}: ${stats.newLevel?.title}!`,
      );
    }
  } catch (err) {
    console.warn('Erro a processar XP:', err);
  }
}

// ---- React Hook ----

export function useFitnessData() {
  const [isUnlocked, setIsUnlocked] = useState(() => getMasterKey() !== null);
  const isFirstTime = !localStorage.getItem('fittrack_initialized');

  const [view, setView] = useState<ViewName>('dashboard');

  const [profile, setProfile] = useLS<UserProfile>(
    'fit_profile',
    { name: 'Atleta', goal: 'hipertrofia', level: 'beginner', weight: 70, xp: 0 } as UserProfile,
    ProfileSchema,
    isUnlocked,
  );
  const [history, setHistory] = useLS<WorkoutSession[]>(
    'fit_history',
    [],
    HistorySchema,
    isUnlocked,
    true,
  );
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | string | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutSession | null>(null);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showFreeBuilder, setShowFreeBuilder] = useState(false);
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false);
  const [pendingRestoreBackup, setPendingRestoreBackup] = useState<PendingBackup | null>(null);

  // ── Auto-login e backup check ──
  useEffect(() => {
    if (isUnlocked) {
      checkBackupAvailability().then((backup) => {
        if (backup) setPendingRestoreBackup(backup);
      });
    } else if (checkSessionUnlock()) {
      setIsUnlocked(true);
    }

    checkDatabaseIntegrity();
  }, [isUnlocked]);

  // ── Silent backup e navegação global ──
  useEffect(() => {
    performSilentBackup();

    const handleNavigate = (e: CustomEvent | Event) => setView((e as CustomEvent).detail);
    const handleOpenWeeklyPlan = () => setShowWeeklyPlan(true);

    window.addEventListener('NAVIGATE_TO', handleNavigate);
    window.addEventListener('OPEN_WEEKLY_PLAN', handleOpenWeeklyPlan);

    return () => {
      window.removeEventListener('NAVIGATE_TO', handleNavigate);
      window.removeEventListener('OPEN_WEEKLY_PLAN', handleOpenWeeklyPlan);
    };
  }, []);

  // ── Handlers ──
  const handleStartWorkout = useCallback((plan: WorkoutPlan | string) => {
    initAudio();
    if (plan === 'OPEN_FREE_BUILDER') {
      setShowFreeBuilder(true);
      return;
    }
    setCurrentPlan(plan);
    setView('workout');
  }, []);

  const handleFinishWorkout = useCallback((data: WorkoutSession) => {
    setWorkoutData(data);
    setView('feedback');
  }, []);

  const handleFeedbackSubmit = useCallback(
    async (feedback: { difficulty: string; notes?: string }) => {
      const finalData = { ...workoutData, feedback };
      const newHistory = [...history, finalData as WorkoutSession];

      // Update challenges
      updateChallengesFromWorkout(finalData as WorkoutSession, newHistory);

      // Save history
      setHistory(newHistory);

      // Sync XP
      await syncXPAndCheckLevelUp(profile.xp || 0, workoutData?.id, setProfile);

      // Reset state
      setWorkoutData(null);
      setCurrentPlan(null);
      setView('dashboard');
    },
    [workoutData, history, profile, setHistory, setProfile],
  );

  const handleInstantSave = useCallback(
    async (data: WorkoutSession) => {
      const finalData = {
        ...data,
        feedback: { difficulty: 'good', notes: 'Caminhada registada.' },
      };
      const newHistory = [...history, finalData as WorkoutSession];

      updateChallengesFromWorkout(finalData as WorkoutSession, newHistory);
      setHistory(newHistory);
      await syncXPAndCheckLevelUp(profile.xp || 0, data.id, setProfile);
      setView('dashboard');
    },
    [history, profile, setHistory, setProfile],
  );

  const handleReset = useCallback(() => {
    setHistory([]);
    setProfile({ name: 'Atleta', goal: 'hipertrofia', level: 'beginner', weight: 70, xp: 0 });
    localStorage.removeItem('fittrack_initialized');
    setView('dashboard');
  }, [setHistory, setProfile]);

  const handleUnlock = useCallback((key: CryptoKey) => {
    setMasterKey(key);
    setIsUnlocked(true);
  }, []);

  const handleConfirmRestore = useCallback(async () => {
    if (!pendingRestoreBackup) return;
    try {
      const buffer = await downloadBackup(pendingRestoreBackup.id);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      await importEncryptedBackup(blob);
    } catch (err) {
      alert('Falha ao restaurar backup automático: ' + (err as Error).message);
      setPendingRestoreBackup(null);
    }
  }, [pendingRestoreBackup]);

  return {
    isUnlocked,
    isFirstTime,
    view,
    profile,
    history,
    currentPlan,
    workoutData,
    showClubModal,
    showFreeBuilder,
    showWeeklyPlan,
    pendingRestoreBackup,

    setView,
    setProfile,
    setShowClubModal,
    setShowFreeBuilder,
    setShowWeeklyPlan,
    setPendingRestoreBackup,

    handleStartWorkout,
    handleFinishWorkout,
    handleFeedbackSubmit,
    handleInstantSave,
    handleReset,
    handleUnlock,
    handleConfirmRestore,
  };
}
