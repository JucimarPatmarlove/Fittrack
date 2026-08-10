import { AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import { LazyLoad } from './components/ui/MotionComponents';

import { LockScreen } from './components/security/LockScreen';
import { SocialModal } from './components/social/SocialModal';
import { BackupRestoreModal } from './components/ui/BackupRestoreModal';
import { BottomNav } from './components/ui/BottomNav';
import { ProactiveBanner } from './components/ai/ProactiveMessage';
import { useProactiveCoach } from './hooks/useProactiveCoach';
import { C } from './data/constants';
import { useFitnessData } from './hooks/useFitnessData';

import { WelcomeWizard } from './components/onboarding/WelcomeWizard';
import { FreeWorkoutBuilder } from './components/workout/FreeWorkoutBuilder';
import { WeeklyPlanGenerator } from './components/workout/WeeklyPlanGenerator';
import { createViewConfigs } from './router/viewConfigs';

const css = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0} html,body{background: #080b0f;color:#eceae4;font-family:'Outfit',sans-serif;-webkit-tap-highlight-color:transparent;min-height:100vh;letter-spacing:0.01em;} h1,h2,h3,.title{font-family:'Bebas Neue',cursive;letter-spacing:2px;} .mono{font-family:'DM Mono',monospace;letter-spacing:-0.02em;} .small{font-family:'Inter',sans-serif;font-size:0.75rem;color:#888;} input:focus{outline:none;border-color:#e8c84a !important;box-shadow: 0 0 12px rgba(232,200,74,0.15)} button:active{transform:scale(0.96)} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none} .glass { background: rgba(18, 25, 35, 0.6); backdrop-filter: blur(4px); border: 1px solid rgba(232, 200, 74, 0.15); border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }`;

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

  useProactiveCoach(profile, history);

  if (!isUnlocked) {
    if (isFirstTime) {
      return (
        <WelcomeWizard
          onComplete={handleUnlock}
          profile={profile}
          setProfile={setProfile}
          onClearMocks={handleReset}
        />
      );
    }
    return <LockScreen onUnlock={handleUnlock} isFirstTime={false} />;
  }

  const viewConfigs = createViewConfigs({
    view,
    profile,
    setProfile,
    history,
    setView,
    handleStartWorkout,
    handleFinishWorkout,
    handleFeedbackSubmit,
    handleInstantSave,
    handleReset,
    handleUnlock,
    workoutData,
    currentPlan,
  });

  const currentView = viewConfigs[view];

  return (
    <div
      style={{
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        paddingBottom: 100,
        minHeight: '100vh',
        position: 'relative',
        background: C.bg,
        color: C.text,
      }}
    >
      <style>{css}</style>
      <ProactiveBanner />

      {pendingRestoreBackup && (
        <BackupRestoreModal
          createdTime={pendingRestoreBackup.createdTime}
          onConfirm={handleConfirmRestore}
          onDismiss={() => setPendingRestoreBackup(null)}
        />
      )}

      <ErrorBoundary>
        <LazyLoad skeleton="card" skeletonClassName="mt-20 mx-4">
          <AnimatePresence mode="wait">{currentView}</AnimatePresence>
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
