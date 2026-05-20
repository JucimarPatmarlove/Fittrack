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
import { ProfileSchema, HistorySchema } from './utils/schemas';

// ── COMPONENTES MENORES & MODULOS LAZY LOAD ─────────────────────────────────
import { FitnessAssessment } from "./components/onboarding/FitnessAssessment";
import { BeginnerGuide } from "./components/onboarding/BeginnerGuide";
import { DetailedHistory } from "./components/history/DetailedHistory";
import { PostWorkoutFeedback } from "./components/workout/PostWorkoutFeedback";
import { PredictiveChallenges } from "./services/predictiveChallenges";
import { RewardsStore } from "./screens/RewardsStore";

// Componentes Pesados - Code Splitting
const Dashboard = lazy(() => import('./screens/Dashboard'));
const ActiveWorkout = lazy(() => import('./screens/ActiveWorkout'));
const Settings = lazy(() => import('./screens/Settings'));
const AICoach = lazy(() => import('./screens/AICoach'));
const Trends = lazy(() => import('./screens/Trends'));
const GymVibe = lazy(() => import('./screens/GymVibe'));
const Milestones = lazy(() => import('./screens/Milestones'));
const CycleReview = lazy(() => import('./screens/CycleReview'));
const DeviceManager = lazy(() => import('./screens/DeviceManager').then(m => ({ default: m.DeviceManager })));

const css = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0} html,body{background: #080b0f;color:#eceae4;font-family:'Outfit',sans-serif;-webkit-tap-highlight-color:transparent;min-height:100vh;letter-spacing:0.01em;} h1,h2,h3,.title{font-family:'Bebas Neue',cursive;letter-spacing:2px;} .mono{font-family:'DM Mono',monospace;letter-spacing:-0.02em;} .small{font-family:'Inter',sans-serif;font-size:0.75rem;color:#888;} input:focus{outline:none;border-color:#e8c84a !important;box-shadow: 0 0 12px rgba(232,200,74,0.15)} button:active{transform:scale(0.96)} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none} .glass { background: rgba(18, 25, 35, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(232, 200, 74, 0.15); border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }`;

const LoadingFallback = () => (
  <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: C.accent, fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2 }}>
    A CARREGAR...
  </div>
);

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const isFirstTime = !localStorage.getItem('fit_profile');

  const [view, setView] = useState("dashboard"); // "dashboard", "workout", "settings", "assessment", "guide", "feedback", "history"
  const [profile, setProfile] = useLS<any>("fit_profile", { name: "Atleta", goal: "hipertrofia", level: "beginner", weight: 70, xp: 0 }, ProfileSchema);
  const [history, setHistory] = useLS<any[]>("fit_history", [], HistorySchema);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [workoutData, setWorkoutData] = useState<any>(null);
  const [showClubModal, setShowClubModal] = useState(false);

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

    const handleNavigate = (e: any) => setView(e.detail);
    window.addEventListener('NAVIGATE_TO', handleNavigate);
    return () => window.removeEventListener('NAVIGATE_TO', handleNavigate);
  }, []);

  const handleStartWorkout = (plan: any) => {
    setCurrentPlan(plan);
    setView("workout");
  };

  const handleFinishWorkout = (data: any) => {
    setWorkoutData(data);
    setView("feedback");
  };

  const handleFeedbackSubmit = (feedback: any) => {
    // Calcular XP a atribuir neste treino:
    const baseXP = workoutData?.duration ? Math.round(workoutData.duration / 60) * 10 : 100;
    const additionalXP = feedback.difficulty === 'hard' ? 50 : 20;
    let challengeXP = 0;

    const finalData = { ...workoutData, feedback };
    const newHistory = [...history, finalData];

    // Verificar desafios batidos
    try {
      const storedC = localStorage.getItem('fit_challenges');
      if (storedC) {
        let challenges = JSON.parse(storedC);
        let updated = false;
        challenges = challenges.map((c: any) => {
          if (c.status === 'active' && PredictiveChallenges.evaluateChallenge(c, finalData, newHistory)) {
            c.status = 'completed';
            challengeXP += c.xpReward;
            updated = true;
          }
          return c;
        });
        if (updated) localStorage.setItem('fit_challenges', JSON.stringify(challenges));
      }
    } catch (e) { }

    const totalXPGained = baseXP + additionalXP + challengeXP;

    setHistory(newHistory);
    setProfile((p: any) => ({ ...p, xp: (p.xp || 0) + totalXPGained })); // Gamification progress!

    setWorkoutData(null);
    setCurrentPlan(null);
    setView("dashboard");
  };

  const handleReset = () => {
    setHistory([]);
    setProfile({ name: "Atleta", goal: "hipertrofia", level: "beginner", weight: 70, xp: 0 });
    setView("dashboard");
  };

  const handleUnlock = (key: CryptoKey) => {
    setMasterKey(key);
    setIsUnlocked(true);
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} isFirstTime={isFirstTime} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Barlow', sans-serif" }}>
      <style>{css}</style>

      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            {view === "dashboard" && <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><Dashboard profile={profile} setProfile={setProfile} history={history} onStartWorkout={handleStartWorkout} /></motion.div>}
            {view === "workout" && currentPlan && <motion.div key="work" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}><ActiveWorkout todayPlan={currentPlan} history={history} profile={profile} onFinish={handleFinishWorkout} onCancel={() => { setCurrentPlan(null); setView("dashboard"); }} /></motion.div>}
            {view === "settings" && <motion.div key="set" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Settings profile={profile} setProfile={setProfile} onReset={handleReset} /></motion.div>}
            {view === "assessment" && <motion.div key="asses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><FitnessAssessment onComplete={(data: any) => { setProfile({ ...profile, ...data }); setView("dashboard"); }} /></motion.div>}
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
    </div>
  );
}
