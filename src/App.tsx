import React, { useState, Suspense, lazy, useEffect } from "react";
import ErrorBoundary from './components/ErrorBoundary';
import { motion, AnimatePresence } from "framer-motion";

// ── IMPORTAÇÕES BASES & CONSTANTES ──────────────────────────────────────────
import { C } from './data/constants';
import { useLS } from './hooks';
import { ClubModal } from "./components/social/ClubModal";
import { Planner } from "./screens/Planner";
import { LockScreen } from './components/security/LockScreen';
import { setMasterKey } from './utils/cryptoEngine';
import { checkForNewerBackup, importEncryptedBackup } from './services/backupService';
import { downloadBackup } from './services/googleDrive';
import { ProfileSchema, HistorySchema } from './utils/schemas';
import { UserProfile, WorkoutSession, WorkoutPlan } from './types';
import { syncUserStats } from './services/gamificationEngine';

// ── COMPONENTES MENORES & MODULOS LAZY LOAD ─────────────────────────────────
import { FitnessAssessment } from "./components/onboarding/FitnessAssessment";
import { BeginnerGuide } from "./components/onboarding/BeginnerGuide";
import { DetailedHistory } from "./components/history/DetailedHistory";
import { PostWorkoutFeedback } from "./components/workout/PostWorkoutFeedback";
import { PredictiveChallenges } from "./services/predictiveChallenges";
import { RewardsStore } from "./screens/RewardsStore";
import { FreeWorkoutBuilder } from "./components/workout/FreeWorkoutBuilder";

// Componentes Pesados - Code Splitting
const Dashboard = lazy(() => import('./screens/Dashboard'));
const ActiveWorkout = lazy(() => import('./screens/ActiveWorkout'));
const Settings = lazy(() => import('./screens/Settings'));
const AICoach = lazy(() => import('./screens/AICoach'));
const Trends = lazy(() => import('./screens/Trends'));
const GymVibe = lazy(() => import('./screens/GymVibe'));
const Milestones = lazy(() => import('./screens/Milestones'));
const CycleReview = lazy(() => import('./screens/CycleReview'));
const BackupScreen = lazy(() => import('./screens/BackupScreen'));
const DeviceManager = lazy(() => import('./screens/DeviceManager').then(m => ({ default: m.DeviceManager })));

const css = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0} html,body{background: #080b0f;color:#eceae4;font-family:'Outfit',sans-serif;-webkit-tap-highlight-color:transparent;min-height:100vh;letter-spacing:0.01em;} h1,h2,h3,.title{font-family:'Bebas Neue',cursive;letter-spacing:2px;} .mono{font-family:'DM Mono',monospace;letter-spacing:-0.02em;} .small{font-family:'Inter',sans-serif;font-size:0.75rem;color:#888;} input:focus{outline:none;border-color:#e8c84a !important;box-shadow: 0 0 12px rgba(232,200,74,0.15)} button:active{transform:scale(0.96)} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none} .glass { background: rgba(18, 25, 35, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(232, 200, 74, 0.15); border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }`;

const LoadingFallback = () => (
  <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: C.accent, fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2 }}>
    A CARREGAR...
  </div>
);

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  // Marca persistente que sobrevive à migração de encriptação
  // O antigo check 'fit_profile' falhava porque a migração remove essa chave do localStorage
  const isFirstTime = !localStorage.getItem('fittrack_initialized');

  const [view, setView] = useState("dashboard"); // "dashboard", "workout", "settings", "assessment", "guide", "feedback", "history"
  const [profile, setProfile] = useLS<UserProfile>("fit_profile", { name: "Atleta", goal: "hipertrofia", level: "beginner", weight: 70, xp: 0 } as UserProfile, ProfileSchema, isUnlocked);
  const [history, setHistory] = useLS<WorkoutSession[]>("fit_history", [], HistorySchema, isUnlocked);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | string | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutSession | null>(null);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showFreeBuilder, setShowFreeBuilder] = useState(false);
  const [pendingRestoreBackup, setPendingRestoreBackup] = useState<{ id: string; name: string; createdTime: string } | null>(null);

  useEffect(() => {
    if (isUnlocked) {
      checkForNewerBackup().then((backup) => {
        if (backup) setPendingRestoreBackup(backup);
      });
    } else {
      const sessionPin = sessionStorage.getItem('fittrack_session_pin');
      if (sessionPin) {
        import('./utils/cryptoEngine').then(async ({ deriveKey, setMasterKey }) => {
          try {
            const key = await deriveKey(sessionPin);
            setMasterKey(key);
            setIsUnlocked(true);
          } catch (e) {
            console.error('Falha no auto-login:', e);
          }
        });
      }
    }

    const checkDatabaseIntegrity = async () => {
      try {
        const { getDB } = await import('./db/schema');
        const db = await getDB();
        const count = await db.count('personalRecords');
        if (count === 0 && sessionStorage.getItem('fittrack_session_pin')) {
          console.warn('[App] IndexedDB vazia. O navegador limpou a base de dados.');
        }
      } catch (e) {}
    };
    checkDatabaseIntegrity();
  }, [isUnlocked]);

  useEffect(() => {
    // AutoBackup System (Offline First Mock)
    const silentBackup = async () => {
      const lastBackup = localStorage.getItem('last_backup');
      if (!lastBackup || Date.now() - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
        const snapshot = {
          profile: localStorage.getItem('fit_profile'),
          history: localStorage.getItem('fit_history'),
          ghostStats: localStorage.getItem('ghost-storage'),
          timestamp: Date.now()
        };

        try {
          const { set } = await import('idb-keyval');
          await set('cloud_backup_mock', snapshot);
          localStorage.setItem('last_backup', Date.now().toString());
          console.log("AutoBackup: Local Snapshot Guardado no IDB.");
        } catch (e) { }
      }
    };
    silentBackup();

    const handleNavigate = (e: CustomEvent | Event) => setView((e as CustomEvent).detail);
    window.addEventListener('NAVIGATE_TO', handleNavigate);
    return () => window.removeEventListener('NAVIGATE_TO', handleNavigate);
  }, []);

  const handleStartWorkout = (plan: WorkoutPlan | string) => {
    if (plan === 'OPEN_FREE_BUILDER') {
      setShowFreeBuilder(true);
      return;
    }
    setCurrentPlan(plan);
    setView("workout");
  };

  const handleFinishWorkout = (data: WorkoutSession) => {
    setWorkoutData(data);
    setView("feedback");
  };

  const handleFeedbackSubmit = async (feedback: { difficulty: string, notes?: string }) => {
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
      // Gamification progress real-time com IndexedDB
      const stats = await syncUserStats(profile.xp || 0, workoutData?.id || '');
      setProfile((p: UserProfile) => ({ ...p, xp: stats.newTotalXP })); // Gamification progress!
      
      if (stats.levelUp) {
        alert(`🏆 PARABÉNS! Subiste para o nível ${stats.newLevel?.level}: ${stats.newLevel?.title}!`);
      }
    } catch (err) {
      console.warn('Erro a processar XP:', err);
    }

    setWorkoutData(null);
    setCurrentPlan(null);
    setView("dashboard");
  };

  const handleReset = () => {
    setHistory([]);
    setProfile({ name: "Atleta", goal: "hipertrofia", level: "beginner", weight: 70, xp: 0 });
    localStorage.removeItem('fittrack_initialized'); // Permite re-onboarding após reset total
    setView("dashboard");
  };

  const handleUnlock = (key: CryptoKey) => {
    setMasterKey(key);
    setIsUnlocked(true);
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreBackup) return;
    try {
      const buffer = await downloadBackup(pendingRestoreBackup.id);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      await importEncryptedBackup(blob);
    } catch (err) {
      alert('Falha ao restaurar backup automático: ' + (err as Error).message);
      setPendingRestoreBackup(null);
    }
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} isFirstTime={isFirstTime} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Barlow', sans-serif" }}>
      <style>{css}</style>

      {/* MODAL DE RESTAURO AUTOMÁTICO */}
      {pendingRestoreBackup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass" style={{ maxWidth: 400, width: '100%', padding: 24, textAlign: 'center' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>☁️</span>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: C.accent, marginBottom: 8, letterSpacing: 1 }}>BACKUP DETETADO</h2>
            <p style={{ fontSize: 14, color: C.text, marginBottom: 16 }}>
              Encontrámos um backup mais recente na tua Google Drive ({new Date(pendingRestoreBackup.createdTime).toLocaleString()}).
              Desejas sincronizar agora e restaurar os teus dados de treino?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={handleConfirmRestore}
                style={{ flex: 1, background: C.accent, color: '#000', border: 'none', borderRadius: 8, padding: 12, fontFamily: "'Bebas Neue'", fontSize: 16, cursor: 'pointer' }}
              >
                RESTOURAR AGORA
              </button>
              <button 
                onClick={() => setPendingRestoreBackup(null)}
                style={{ flex: 1, background: 'transparent', color: C.muted, border: `1px solid ${C.muted}`, borderRadius: 8, padding: 12, fontFamily: "'Bebas Neue'", fontSize: 16, cursor: 'pointer' }}
              >
                IGNORAR
              </button>
            </div>
          </div>
        </div>
      )}

      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            {view === "dashboard" && <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><Dashboard profile={profile} setProfile={setProfile} history={history} onStartWorkout={handleStartWorkout} /></motion.div>}
            {view === "workout" && currentPlan && <motion.div key="work" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}><ActiveWorkout todayPlan={currentPlan} history={history} profile={profile} onFinish={handleFinishWorkout} onCancel={() => { setCurrentPlan(null); setView("dashboard"); }} /></motion.div>}
            {view === "settings" && <motion.div key="set" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Settings profile={profile} setProfile={setProfile} onReset={handleReset} /></motion.div>}
            {view === "assessment" && <motion.div key="asses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><FitnessAssessment onComplete={(data: Partial<UserProfile>) => { setProfile({ ...profile, ...data } as UserProfile); setView("dashboard"); }} /></motion.div>}
            {view === "guide" && <motion.div key="gui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><BeginnerGuide onComplete={() => setView("dashboard")} /></motion.div>}
            {view === "history" && <motion.div key="hist" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><DetailedHistory workouts={history} profile={profile} onStartWorkout={handleStartWorkout} /></motion.div>}
            {view === "feedback" && <motion.div key="feed" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}><PostWorkoutFeedback onSubmit={handleFeedbackSubmit} profile={profile} workoutData={workoutData} /></motion.div>}
            {view === "aicoach" && <motion.div key="aicoach" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><AICoach history={history} profile={profile} /></motion.div>}
            {view === "trends" && <motion.div key="trends" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Trends history={history} /></motion.div>}
            {view === "planner" && <motion.div key="planner" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Planner /></motion.div>}
            {view === "gymvibe" && <motion.div key="gymvibe" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><GymVibe profile={profile} /></motion.div>}
            {view === "milestones" && <motion.div key="milestones" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Milestones history={history} /></motion.div>}
            {view === "cyclereview" && <motion.div key="cyclereview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><CycleReview history={history} onClose={() => setView("dashboard")} onGenerateNewPlan={() => { setView("dashboard"); window.dispatchEvent(new CustomEvent('OPEN_WEEKLY_PLAN')); }} /></motion.div>}
            {view === "devices" && <motion.div key="devices" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><DeviceManager /></motion.div>}
            {view === "rewards" && <motion.div key="rewards" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><RewardsStore onClose={() => setView("dashboard")} /></motion.div>}
            {view === "backup" && <motion.div key="backup" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><BackupScreen /></motion.div>}
          </AnimatePresence>
        </Suspense>
      </ErrorBoundary>

      {view !== "workout" && view !== "assessment" && view !== "guide" && view !== "feedback" && view !== "rewards" && (
        <div style={{ position: "fixed", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 100, pointerEvents: "none" }}>
          <div className="glass" style={{ display: "flex", gap: "20px", padding: "12px 24px", borderRadius: "32px", pointerEvents: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <button onClick={() => setView("dashboard")} style={{ background: "none", border: "none", color: view === "dashboard" ? C.accent : C.muted, cursor: "pointer", fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>🏋️</span>
              {view === "dashboard" && <span style={{ fontSize: 10, fontWeight: "bold" }}>Treino</span>}
            </button>
            <button onClick={() => setView("trends")} style={{ background: "none", border: "none", color: view === "trends" ? C.accent : C.muted, cursor: "pointer", fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>📈</span>
              {view === "trends" && <span style={{ fontSize: 10, fontWeight: "bold" }}>Tendências</span>}
            </button>
            <button onClick={() => setView("planner")} style={{ background: "none", border: "none", color: view === "planner" ? C.accent : C.muted, cursor: "pointer", fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>🗓️</span>
              {view === "planner" && <span style={{ fontSize: 10, fontWeight: "bold" }}>Planner</span>}
            </button>
            <button onClick={() => setView("gymvibe")} style={{ background: "none", border: "none", color: view === "gymvibe" ? C.accent : C.muted, cursor: "pointer", fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>🎵</span>
              {view === "gymvibe" && <span style={{ fontSize: 10, fontWeight: "bold" }}>Vibe</span>}
            </button>
            {history.length >= 3 ? (
              <button onClick={() => setShowClubModal(true)} style={{ background: "none", border: "none", color: showClubModal ? C.accent : C.muted, cursor: "pointer", fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 20 }}>👥</span>
                {showClubModal && <span style={{ fontSize: 10, fontWeight: "bold" }}>Clube</span>}
              </button>
            ) : (
              <button onClick={() => alert('🔒 Os Clubes Sociais desbloqueiam ao completares o 3º Treino! Continua assim!')} style={{ background: "none", border: "none", color: C.muted, opacity: 0.5, cursor: "pointer", fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 20 }}>👥</span>
              </button>
            )}
            <button onClick={() => setView("rewards")} style={{ background: "none", border: "none", color: view === "rewards" ? C.accent : C.muted, cursor: "pointer", fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>💎</span>
              {view === "rewards" && <span style={{ fontSize: 10, fontWeight: "bold" }}>Loja</span>}
            </button>
            <button onClick={() => setView("settings")} style={{ background: "none", border: "none", color: view === "settings" ? C.accent : C.muted, cursor: "pointer", fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>👤</span>
              {view === "settings" && <span style={{ fontSize: 10, fontWeight: "bold" }}>Perfil</span>}
            </button>
          </div>
        </div>
      )}

      {showClubModal && <ClubModal onClose={() => setShowClubModal(false)} />}
      {showFreeBuilder && (
        <FreeWorkoutBuilder 
          profile={profile}
          onClose={() => setShowFreeBuilder(false)}
          onStart={(plan) => {
            setShowFreeBuilder(false);
            handleStartWorkout(plan);
          }}
        />
      )}
    </div>
  );
}
