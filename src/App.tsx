// @ts-nocheck
import React, { Suspense, lazy } from "react";
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence } from "framer-motion";
import { PageTransition, LazyLoad } from './components/ui/MotionComponents';

// ── IMPORTAÇÕES BASES & CONSTANTES ──────────────────────────────────────────
import { C } from './data/constants';
import { useFitnessData } from './hooks/useFitnessData';
import { BottomNav } from './components/ui/BottomNav';
import { BackupRestoreModal } from './components/ui/BackupRestoreModal';
import { SocialModal } from "./components/social/SocialModal";
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
const CompeteScreen = lazy(() => import('./screens/CompeteScreen'));
const RecoveryScreen = lazy(() => import('./screens/RecoveryScreen'));

const css = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0} html,body{background: #080b0f;color:#eceae4;font-family:'Outfit',sans-serif;-webkit-tap-highlight-color:transparent;min-height:100vh;letter-spacing:0.01em;} h1,h2,h3,.title{font-family:'Bebas Neue',cursive;letter-spacing:2px;} .mono{font-family:'DM Mono',monospace;letter-spacing:-0.02em;} .small{font-family:'Inter',sans-serif;font-size:0.75rem;color:#888;} input:focus{outline:none;border-color:#e8c84a !important;box-shadow: 0 0 12px rgba(232,200,74,0.15)} button:active{transform:scale(0.96)} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none} .glass { background: rgba(18, 25, 35, 0.6); backdrop-filter: blur(4px); border: 1px solid rgba(232, 200, 74, 0.15); border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }`;

// ── ANIMATION VARIANTS ─────────────────────────────────────────────────────
// As animações agora são delegadas para PageTransition em MotionComponents

interface ViewConfig {
  key: string;
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
      <PageTransition viewKey="dash">
        <Dashboard profile={profile} setProfile={setProfile} history={history} onStartWorkout={handleStartWorkout} />
      </PageTransition>
    ),
    workout: currentPlan ? (
      <PageTransition viewKey="work">
        <ActiveWorkout todayPlan={currentPlan} history={history} profile={profile} onFinish={handleFinishWorkout} onCancel={() => setView("dashboard")} />
      </PageTransition>
    ) : null,
    settings: (
      <PageTransition viewKey="set">
        <Settings profile={profile} setProfile={setProfile} onReset={handleReset} />
      </PageTransition>
    ),
    assessment: (
      <PageTransition viewKey="asses">
        <FitnessAssessment onComplete={(data: Partial<UserProfile>) => { setProfile({ ...profile, ...data } as UserProfile); setView("dashboard"); }} />
      </PageTransition>
    ),
    guide: (
      <PageTransition viewKey="gui">
        <BeginnerGuide onComplete={() => setView("dashboard")} />
      </PageTransition>
    ),
    history: (
      <PageTransition viewKey="hist">
        <DetailedHistory workouts={history} profile={profile} onStartWorkout={handleStartWorkout} />
      </PageTransition>
    ),
    feedback: (
      <PageTransition viewKey="feed">
        <PostWorkoutFeedback onSubmit={handleFeedbackSubmit} profile={profile} workoutData={workoutData} />
      </PageTransition>
    ),
    aicoach: (
      <PageTransition viewKey="aicoach">
        <AICoach history={history} profile={profile} />
      </PageTransition>
    ),
    trends: (
      <PageTransition viewKey="trends">
        <Trends history={history} />
      </PageTransition>
    ),
    planner: (
      <PageTransition viewKey="planner">
        <Planner onStartWorkout={handleStartWorkout} />
      </PageTransition>
    ),
    gymvibe: (
      <PageTransition viewKey="gymvibe">
        <GymVibe profile={profile} />
      </PageTransition>
    ),
    milestones: (
      <PageTransition viewKey="milestones">
        <Milestones history={history} />
      </PageTransition>
    ),
    cyclereview: (
      <PageTransition viewKey="cyclereview">
        <CycleReview history={history} onClose={() => setView("dashboard")} onGenerateNewPlan={() => { setView("dashboard"); window.dispatchEvent(new CustomEvent('OPEN_WEEKLY_PLAN')); }} />
      </PageTransition>
    ),
    nutrition: (
      <PageTransition viewKey="nutrition">
        {buildNutritionView(profile, setProfile)}
      </PageTransition>
    ),
    devices: (
      <PageTransition viewKey="devices">
        <DeviceManager />
      </PageTransition>
    ),
    rewards: (
      <PageTransition viewKey="rewards">
        <RewardsStore onClose={() => setView("dashboard")} />
      </PageTransition>
    ),
    backup: (
      <PageTransition viewKey="backup">
        <BackupScreen />
      </PageTransition>
    ),
    walkingcoach: (
      <PageTransition viewKey="walkingcoach">
        <WalkingCoachScreen 
           onClose={() => setView("dashboard")} 
           onFinish={handleInstantSave} 
        />
      </PageTransition>
    ),
    community: (
      <PageTransition viewKey="community">
        <CommunityFeed profile={profile} />
      </PageTransition>
    ),
    compete: (
      <PageTransition viewKey="compete">
        <CompeteScreen />
      </PageTransition>
    ),
    recovery: (
      <PageTransition viewKey="recovery">
        <RecoveryScreen />
      </PageTransition>
    )
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
        <LazyLoad skeleton="card" skeletonClassName="mt-20 mx-4">
          <AnimatePresence mode="wait">
            {currentView}
          </AnimatePresence>
        </LazyLoad>
      </ErrorBoundary>

      <BottomNav
        view={view}
        setView={setView}
        historyCount={history.length}
        onOpenClub={() => setShowClubModal(true)}
      />

      {showClubModal && <SocialModal onClose={() => setShowClubModal(false)} />}
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
