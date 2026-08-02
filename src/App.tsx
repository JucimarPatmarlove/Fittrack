import React, { Suspense, lazy } from "react";
import ErrorBoundary from './components/ErrorBoundary';
import { motion, AnimatePresence } from "framer-motion";

// ── IMPORTAÇÕES BASES & CONSTANTES ──────────────────────────────────────────
import { C } from './data/constants';
import { useFitnessData } from './hooks/useFitnessData';
import { BottomNav } from './components/ui/BottomNav';
import { BackupRestoreModal } from './components/ui/BackupRestoreModal';
import { ClubModal } from "./components/social/ClubModal";
import { LockScreen } from './components/security/LockScreen';
import { useNutritionStore } from './stores/useNutritionStore';
import { getTodayDateString } from './services/nutritionEngine';

// ── COMPONENTES MENORES & MODULOS LAZY LOAD ─────────────────────────────────
import { WelcomeWizard } from "./components/onboarding/WelcomeWizard";
import { FitnessAssessment } from "./components/onboarding/FitnessAssessment";
import { BeginnerGuide } from "./components/onboarding/BeginnerGuide";
import { PostWorkoutFeedback } from "./components/workout/PostWorkoutFeedback";
import { FreeWorkoutBuilder } from "./components/workout/FreeWorkoutBuilder";
import { WeeklyPlanGenerator } from "./components/workout/WeeklyPlanGenerator";
import { UserProfile, WorkoutPlan } from './types';
import { WorkoutSession } from './db/schema';
import { ViewName } from './hooks/useFitnessData';

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
const WalkingCoachScreen = lazy(() => import('./screens/WalkingCoachScreen'));
const DetailedHistory = lazy(() => import('./components/history/DetailedHistory').then(m => ({ default: m.DetailedHistory })));
const Planner = lazy(() => import('./screens/Planner').then(m => ({ default: m.Planner })));
const NutritionPlanner = lazy(() => import('./screens/NutritionPlanner'));
const RewardsStore = lazy(() => import('./screens/RewardsStore').then(m => ({ default: m.RewardsStore })));
const CommunityFeed = lazy(() => import('./screens/CommunityFeed'));

const css = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0} html,body{background: #080b0f;color:#eceae4;font-family:'Outfit',sans-serif;-webkit-tap-highlight-color:transparent;min-height:100vh;letter-spacing:0.01em;} h1,h2,h3,.title{font-family:'Bebas Neue',cursive;letter-spacing:2px;} .mono{font-family:'DM Mono',monospace;letter-spacing:-0.02em;} .small{font-family:'Inter',sans-serif;font-size:0.75rem;color:#888;} input:focus{outline:none;border-color:#e8c84a !important;box-shadow: 0 0 12px rgba(232,200,74,0.15)} button:active{transform:scale(0.96)} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none} .glass { background: rgba(18, 25, 35, 0.6); backdrop-filter: blur(4px); border: 1px solid rgba(232, 200, 74, 0.15); border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }`;

const LoadingFallback = () => (
  <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: C.accent, fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2 }}>
    A CARREGAR...
  </div>
);

// ── ANIMATION VARIANTS ─────────────────────────────────────────────────────
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };
const slideUp = { initial: { y: 50, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { opacity: 0 } };
const slideLeft = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0 } };
const scaleIn = { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 } };
const scaleFade = { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0 } };

interface ViewConfig {
  key: string;
  animation: typeof fadeIn;
  component: React.ReactNode;
}

/** Build the NutritionPlanner view with required props */
function buildNutritionView(
  profile: UserProfile,
  setProfile: (p: UserProfile) => void
): React.ReactNode {
  return (
    <NutritionPlanner 
      profile={profile} 
      meals={[useNutritionStore.getState().currentMealLog].filter(Boolean) as any} 
      onUpdateProfile={(p) => setProfile({ ...profile, ...p })} 
      onAddMealItem={(type, item) => useNutritionStore.getState().addMeal(getTodayDateString(), type, item as any)} 
      onRemoveMealItem={(type, id) => useNutritionStore.getState().removeMeal(getTodayDateString(), type, id)} 
      currentDate={getTodayDateString()} 
    />
  );
}

/** Create the view configuration map from hook state and handlers */
function createViewConfigs(
  view: string,
  profile: UserProfile,
  setProfile: (p: UserProfile) => void,
  history: WorkoutSession[],
  setView: (v: ViewName) => void,
  handleStartWorkout: (plan: WorkoutPlan | string) => void,
  handleFinishWorkout: (data: WorkoutSession) => void,
  handleFeedbackSubmit: (feedback: { difficulty: string; notes?: string }) => Promise<void>,
  handleInstantSave: (data: WorkoutSession) => Promise<void>,
  handleReset: () => void,
  handleUnlock: (key: CryptoKey) => void,
  workoutData: WorkoutSession | null,
  currentPlan: WorkoutPlan | string | null
): Record<string, React.ReactNode> {
  return {
    dashboard: (
      <motion.div key="dash" {...fadeIn}>
        <Dashboard profile={profile} setProfile={setProfile} history={history} onStartWorkout={handleStartWorkout} />
      </motion.div>
    ),
    workout: currentPlan ? (
      <motion.div key="work" {...slideUp}>
        <ActiveWorkout todayPlan={currentPlan} history={history} profile={profile} onFinish={handleFinishWorkout} onCancel={() => setView("dashboard")} />
      </motion.div>
    ) : null,
    settings: (
      <motion.div key="set" {...fadeIn}>
        <Settings profile={profile} setProfile={setProfile} onReset={handleReset} />
      </motion.div>
    ),
    assessment: (
      <motion.div key="asses" {...fadeIn}>
        <FitnessAssessment onComplete={(data: Partial<UserProfile>) => { setProfile({ ...profile, ...data } as UserProfile); setView("dashboard"); }} />
      </motion.div>
    ),
    guide: (
      <motion.div key="gui" {...fadeIn}>
        <BeginnerGuide onComplete={() => setView("dashboard")} />
      </motion.div>
    ),
    history: (
      <motion.div key="hist" {...slideLeft}>
        <DetailedHistory workouts={history} profile={profile} onStartWorkout={handleStartWorkout} />
      </motion.div>
    ),
    feedback: (
      <motion.div key="feed" {...scaleIn}>
        <PostWorkoutFeedback onSubmit={handleFeedbackSubmit} profile={profile} workoutData={workoutData} />
      </motion.div>
    ),
    aicoach: (
      <motion.div key="aicoach" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <AICoach history={history} profile={profile} />
      </motion.div>
    ),
    trends: (
      <motion.div key="trends" {...scaleFade}>
        <Trends history={history} />
      </motion.div>
    ),
    planner: (
      <motion.div key="planner" {...scaleFade}>
        <Planner onStartWorkout={handleStartWorkout} />
      </motion.div>
    ),
    gymvibe: (
      <motion.div key="gymvibe" {...scaleFade}>
        <GymVibe profile={profile} />
      </motion.div>
    ),
    milestones: (
      <motion.div key="milestones" {...scaleFade}>
        <Milestones history={history} />
      </motion.div>
    ),
    cyclereview: (
      <motion.div key="cyclereview" {...scaleFade}>
        <CycleReview history={history} onClose={() => setView("dashboard")} onGenerateNewPlan={() => { setView("dashboard"); window.dispatchEvent(new CustomEvent('OPEN_WEEKLY_PLAN')); }} />
      </motion.div>
    ),
    nutrition: (
      <motion.div key="nutrition" {...scaleFade}>
        {buildNutritionView(profile, setProfile)}
      </motion.div>
    ),
    devices: (
      <motion.div key="devices" {...scaleFade}>
        <DeviceManager />
      </motion.div>
    ),
    rewards: (
      <motion.div key="rewards" {...scaleFade}>
        <RewardsStore onClose={() => setView("dashboard")} />
      </motion.div>
    ),
    backup: (
      <motion.div key="backup" {...scaleFade}>
        <BackupScreen />
      </motion.div>
    ),
    walkingcoach: (
      <motion.div key="walkingcoach" {...scaleFade}>
        <WalkingCoachScreen 
           onClose={() => setView("dashboard")} 
           onFinish={handleInstantSave} 
        />
      </motion.div>
    ),
    community: (
      <motion.div key="community" {...scaleFade}>
        <CommunityFeed profile={profile} />
      </motion.div>
    ),
  };
}

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
    handleInstantSave,
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

  const viewConfigs = createViewConfigs(
    view, profile, setProfile, history, setView,
    handleStartWorkout, handleFinishWorkout, handleFeedbackSubmit,
    handleInstantSave, handleReset, handleUnlock, workoutData, currentPlan
  );

  const currentView = viewConfigs[view];

  return (
    <div style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))', paddingBottom: 100, minHeight: '100vh', position: 'relative', background: C.bg, color: C.text }}>
      <style>{css}</style>

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
            {currentView}
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
