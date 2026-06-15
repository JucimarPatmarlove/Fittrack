import React, { Suspense, lazy } from "react";
import ErrorBoundary from './components/ErrorBoundary';
import { motion, AnimatePresence } from "framer-motion";

// ── IMPORTAÇÕES BASES & CONSTANTES ──────────────────────────────────────────
import { C } from './data/constants';
import { useFitnessData } from './hooks/useFitnessData';
import { BottomNav } from './components/ui/BottomNav';
import { BackupRestoreModal } from './components/ui/BackupRestoreModal';
import { ClubModal } from "./components/social/ClubModal";
import { Planner } from "./screens/Planner";
import { LockScreen } from './components/security/LockScreen';
import { useNutritionStore } from './stores/useNutritionStore';
import { getTodayDateString } from './services/nutritionEngine';

// ── COMPONENTES MENORES & MODULOS LAZY LOAD ─────────────────────────────────
import { WelcomeWizard } from "./components/onboarding/WelcomeWizard";
import { FitnessAssessment } from "./components/onboarding/FitnessAssessment";
import { BeginnerGuide } from "./components/onboarding/BeginnerGuide";
import { DetailedHistory } from "./components/history/DetailedHistory";
import { PostWorkoutFeedback } from "./components/workout/PostWorkoutFeedback";
import { RewardsStore } from "./screens/RewardsStore";
import { FreeWorkoutBuilder } from "./components/workout/FreeWorkoutBuilder";
import { WeeklyPlanGenerator } from "./components/workout/WeeklyPlanGenerator";
import NutritionPlanner from './screens/NutritionPlanner';
import { UserProfile } from './types';

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
  const {
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
    handleReset,
    handleUnlock,
    handleConfirmRestore,
  } = useFitnessData();

  if (!isUnlocked) {
    if (isFirstTime) {
      return <WelcomeWizard 
                onComplete={handleUnlock} 
                profile={profile} 
                setProfile={setProfile} 
                onClearMocks={handleReset} 
             />;
    }
    return <LockScreen onUnlock={handleUnlock} isFirstTime={false} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Barlow', sans-serif" }}>
      <style>{css}</style>

      {/* MODAL DE RESTAURO AUTOMÁTICO */}
      {pendingRestoreBackup && (
        <BackupRestoreModal
          createdTime={pendingRestoreBackup.createdTime}
          onConfirm={handleConfirmRestore}
          onDismiss={() => setPendingRestoreBackup(null)}
        />
      )}

      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            {view === "dashboard" && <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><Dashboard profile={profile} setProfile={setProfile} history={history} onStartWorkout={handleStartWorkout} /></motion.div>}
            {view === "workout" && workoutData && <motion.div key="work" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}><ActiveWorkout todayPlan={workoutData} history={history} profile={profile} onFinish={handleFinishWorkout} onCancel={() => { setView("dashboard"); }} /></motion.div>}
            {view === "settings" && <motion.div key="set" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Settings profile={profile} setProfile={setProfile} onReset={handleReset} /></motion.div>}
            {view === "assessment" && <motion.div key="asses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><FitnessAssessment onComplete={(data: Partial<UserProfile>) => { setProfile({ ...profile, ...data } as UserProfile); setView("dashboard"); }} /></motion.div>}
            {view === "guide" && <motion.div key="gui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><BeginnerGuide onComplete={() => setView("dashboard")} /></motion.div>}
            {view === "history" && <motion.div key="hist" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><DetailedHistory workouts={history} profile={profile} onStartWorkout={handleStartWorkout} /></motion.div>}
            {view === "feedback" && <motion.div key="feed" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}><PostWorkoutFeedback onSubmit={handleFeedbackSubmit} profile={profile} workoutData={workoutData} /></motion.div>}
            {view === "aicoach" && <motion.div key="aicoach" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><AICoach history={history} profile={profile} /></motion.div>}
            {view === "trends" && <motion.div key="trends" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Trends history={history} /></motion.div>}
            {view === "planner" && <motion.div key="planner" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Planner onStartWorkout={handleStartWorkout} /></motion.div>}
            {view === "gymvibe" && <motion.div key="gymvibe" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><GymVibe profile={profile} /></motion.div>}
            {view === "milestones" && <motion.div key="milestones" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Milestones history={history} /></motion.div>}
            {view === "cyclereview" && <motion.div key="cyclereview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><CycleReview history={history} onClose={() => setView("dashboard")} onGenerateNewPlan={() => { setView("dashboard"); window.dispatchEvent(new CustomEvent('OPEN_WEEKLY_PLAN')); }} /></motion.div>}
            {view === "nutrition" && <motion.div key="nutrition" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <NutritionPlanner 
                profile={profile} 
                meals={[useNutritionStore.getState().currentMealLog].filter(Boolean) as any} 
                onUpdateProfile={(p) => setProfile({ ...profile, ...p })} 
                onAddMealItem={(type, item) => useNutritionStore.getState().addMeal(getTodayDateString(), type, item as any)} 
                onRemoveMealItem={(type, id) => useNutritionStore.getState().removeMeal(getTodayDateString(), type, id)} 
                currentDate={getTodayDateString()} 
              />
            </motion.div>}
            {view === "devices" && <motion.div key="devices" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><DeviceManager /></motion.div>}
            {view === "rewards" && <motion.div key="rewards" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><RewardsStore onClose={() => setView("dashboard")} /></motion.div>}
            {view === "backup" && <motion.div key="backup" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><BackupScreen /></motion.div>}
          </AnimatePresence>
        </Suspense>
      </ErrorBoundary>

      <BottomNav
        view={view}
        setView={setView}
        historyCount={history.length}
        onOpenClub={() => setShowClubModal(true)}
      />

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
      {showWeeklyPlan && (
        <WeeklyPlanGenerator 
          profile={profile}
          setProfile={setProfile}
          onClose={() => setShowWeeklyPlan(false)}
          onStartWorkout={(plan) => {
            setShowWeeklyPlan(false);
            handleStartWorkout(plan);
          }}
        />
      )}
    </div>
  );
}
