// src/hooks/useFitnessData.ts
// Hook customizado que encapsula toda a lógica de persistência, XP e feedback do App.tsx
// Resultado da refatoração: App.tsx fica responsável apenas pela navegação e renderização.

import { useState, useEffect, useCallback } from 'react';
import { useLS } from './index';
import { ProfileSchema, HistorySchema } from '../utils/schemas';
import { UserProfile, WorkoutPlan } from "../types";
import { WorkoutSession } from "../db/schema";;
import { setMasterKey, getMasterKey } from '../utils/cryptoEngine';
import { checkForNewerBackup, importEncryptedBackup } from '../services/backupService';
import { downloadBackup } from '../services/googleDrive';
import { syncUserStats } from '../services/gamificationEngine';
import { PredictiveChallenges } from '../services/predictiveChallenges';

export type ViewName =
  | 'dashboard' | 'workout' | 'settings' | 'assessment' | 'guide'
  | 'feedback' | 'history' | 'aicoach' | 'trends' | 'planner'
  | 'gymvibe' | 'milestones' | 'cyclereview' | 'nutrition'
  | 'devices' | 'rewards' | 'backup';

interface PendingBackup {
  id: string;
  name: string;
  createdTime: string;
}

export function useFitnessData() {
  const [isUnlocked, setIsUnlocked] = useState(() => getMasterKey() !== null);
  const isFirstTime = !localStorage.getItem('fittrack_initialized');

  const [view, setView] = useState<ViewName>('dashboard');

  const [profile, setProfile] = useLS<UserProfile>(
    'fit_profile',
    { name: 'Atleta', goal: 'hipertrofia', level: 'beginner', weight: 70, xp: 0 } as UserProfile,
    ProfileSchema,
    isUnlocked
  );
  const [history, setHistory] = useLS<WorkoutSession[]>('fit_history', [], HistorySchema, isUnlocked, true); // idbOnly: dados pesados não tocam no localStorage
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | string | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutSession | null>(null);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showFreeBuilder, setShowFreeBuilder] = useState(false);
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false);
  const [pendingRestoreBackup, setPendingRestoreBackup] = useState<PendingBackup | null>(null);

  // ── Auto-login e backup check ──
  useEffect(() => {
    if (isUnlocked) {
      checkForNewerBackup().then((backup) => {
        if (backup) setPendingRestoreBackup(backup);
      });
    } else {
      const sessionUnlocked = sessionStorage.getItem('fittrack_session_unlocked') === 'true';
      if (sessionUnlocked && getMasterKey() !== null) {
        setIsUnlocked(true);
      } else if (sessionUnlocked && getMasterKey() === null) {
        // A sessão indica que estava desbloqueada, mas a key em memória perdeu-se (ex: F5 / Reload).
        // A UI apresentará o ecrã de LockScreen para re-derivar a chave de forma segura.
        setIsUnlocked(false);
      }
    }

    const checkDatabaseIntegrity = async () => {
      try {
        const { getDB } = await import('../db/schema');
        const db = await getDB();
        const count = await db.count('personalRecords');
        if (count === 0 && sessionStorage.getItem('fittrack_session_unlocked') === 'true') {
          console.warn('[App] IndexedDB vazia. O navegador limpou a base de dados.');
        }
      } catch (e) {}
    };
    checkDatabaseIntegrity();
  }, [isUnlocked]);

  // ── Silent backup e navegação global ──
  useEffect(() => {
    const silentBackup = async () => {
      const lastBackup = localStorage.getItem('last_backup');
      if (!lastBackup || Date.now() - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
        try {
          const { get, set } = await import('idb-keyval');
          // Ler dados do IDB (fonte de verdade) em vez do localStorage
          const profileData = await get('fit_profile') || localStorage.getItem('fit_profile');
          const historyData = await get('fit_history');
          const ghostData = await get('ghost-storage') || localStorage.getItem('ghost-storage');
          const snapshot = {
            profile: profileData || null,
            history: historyData || null,
            ghostStats: ghostData || null,
            timestamp: Date.now()
          };
          await set('cloud_backup_mock', snapshot);
          localStorage.setItem('last_backup', Date.now().toString());
          console.log('AutoBackup: Snapshot (IDB-source) guardado.');
        } catch (e) { }
      }
    };
    silentBackup();

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

  const handleFeedbackSubmit = useCallback(async (feedback: { difficulty: string; notes?: string }) => {
    const finalData = { ...workoutData, feedback };
    const newHistory = [...history, finalData as WorkoutSession];

    // Verificar desafios batidos
    try {
      const storedC = localStorage.getItem('fit_challenges');
      if (storedC) {
        let challenges = JSON.parse(storedC);
        let updated = false;
        challenges = challenges.map((c: any) => {
          if (c.status === 'active' && PredictiveChallenges.evaluateChallenge(c, finalData, newHistory)) {
            c.status = 'completed';
            updated = true;
          }
          return c;
        });
        if (updated) localStorage.setItem('fit_challenges', JSON.stringify(challenges));
      }
    } catch (e) { }

    setHistory(newHistory);

    try {
      const stats = await syncUserStats(profile.xp || 0, workoutData?.id || '');
      setProfile((p: UserProfile) => ({ ...p, xp: stats.newTotalXP }));
      if (stats.levelUp) {
        alert(`🏆 PARABÉNS! Subiste para o nível ${stats.newLevel?.level}: ${stats.newLevel?.title}!`);
      }
    } catch (err) {
      console.warn('Erro a processar XP:', err);
    }

    setWorkoutData(null);
    setCurrentPlan(null);
    setView('dashboard');
  }, [workoutData, history, profile, setHistory, setProfile]);

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
    // State
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

    // Setters
    setView,
    setProfile,
    setShowClubModal,
    setShowFreeBuilder,
    setShowWeeklyPlan,
    setPendingRestoreBackup,

    // Handlers
    handleStartWorkout,
    handleFinishWorkout,
    handleFeedbackSubmit,
    handleReset,
    handleUnlock,
    handleConfirmRestore,
  };
}
