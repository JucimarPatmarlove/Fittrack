import type React from 'react';
import { lazy } from 'react';
import { PageTransition } from '../components/ui/MotionComponents';
import type { WorkoutSession } from '../db/schema';
import type { ViewName } from '../hooks/useFitnessData';
import type { UserProfile, WorkoutPlan } from '../types';
import { useNutritionStore } from '../stores/useNutritionStore';
import { getTodayDateString } from '../services/nutritionEngine';

import { BeginnerGuide } from '../components/onboarding/BeginnerGuide';
import { FitnessAssessment } from '../components/onboarding/FitnessAssessment';
import { ProactiveMessageList } from '../components/ai/ProactiveMessage';

// Lazy loaded components
const Dashboard = lazy(() => import('../screens/Dashboard'));
const ActiveWorkout = lazy(() => import('../screens/ActiveWorkout'));
const Settings = lazy(() => import('../screens/Settings'));
const AICoach = lazy(() => import('../screens/AICoach'));
const Trends = lazy(() => import('../screens/Trends'));
const GymVibe = lazy(() => import('../screens/GymVibe'));
const Milestones = lazy(() => import('../screens/Milestones'));
const CycleReview = lazy(() =>
  import('../screens/CycleReview').then((m) => ({ default: m.CycleReview })),
);
const BackupScreen = lazy(() => import('../screens/BackupScreen'));
const DeviceManager = lazy(() =>
  import('../screens/DeviceManager').then((m) => ({ default: m.DeviceManager })),
);
const WalkingCoachScreen = lazy(() => import('../screens/WalkingCoachScreen'));
const DetailedHistory = lazy(() =>
  import('../components/history/DetailedHistory').then((m) => ({ default: m.DetailedHistory })),
);
const Planner = lazy(() => import('../screens/Planner').then((m) => ({ default: m.Planner })));
const NutritionPlanner = lazy(() => import('../screens/NutritionPlanner'));
const RewardsStore = lazy(() =>
  import('../screens/RewardsStore').then((m) => ({ default: m.RewardsStore })),
);
const CommunityFeed = lazy(() => import('../screens/CommunityFeed'));
const CompeteScreen = lazy(() => import('../screens/CompeteScreen'));
const RecoveryScreen = lazy(() => import('../screens/RecoveryScreen'));

export interface ViewConfigProps {
  view: ViewName;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  history: WorkoutSession[];
  setView: (v: ViewName) => void;
  handleStartWorkout: (plan: WorkoutPlan | string) => void;
  handleFinishWorkout: (data: WorkoutSession) => void;
  handleFeedbackSubmit: (feedback: { difficulty: string; notes?: string }) => Promise<void>;
  handleInstantSave: (data: WorkoutSession) => Promise<void>;
  handleReset: () => void;
  handleUnlock: (key: CryptoKey) => void;
  workoutData: WorkoutSession | null;
  currentPlan: WorkoutPlan | string | null;
}

/** Build the NutritionPlanner view with required props */
export function buildNutritionView(
  profile: UserProfile,
  setProfile: (p: UserProfile) => void,
): React.ReactNode {
  return (
    <NutritionPlanner
      profile={profile}
      meals={[useNutritionStore.getState().currentMealLog].filter(Boolean) as any}
      onUpdateProfile={(p: Partial<UserProfile>) => setProfile({ ...profile, ...p } as UserProfile)}
      onAddMealItem={(type: string, item: any) =>
        useNutritionStore.getState().addMeal(getTodayDateString(), type, item as any)
      }
      onRemoveMealItem={(type: string, id: string) =>
        useNutritionStore.getState().removeMeal(getTodayDateString(), type, id)
      }
      currentDate={getTodayDateString()}
    />
  );
}

/** Create the view configuration map from hook state and handlers */
export function createViewConfigs(props: ViewConfigProps): Record<string, React.ReactNode> {
  const {
    profile,
    setProfile,
    history,
    setView,
    handleStartWorkout,
    handleFinishWorkout,
    handleFeedbackSubmit,
    handleInstantSave,
    handleReset,
    workoutData,
    currentPlan,
  } = props;

  return {
    dashboard: (
      <PageTransition viewKey="dash">
        <Dashboard
          profile={profile}
          setProfile={setProfile}
          history={history}
          onStartWorkout={handleStartWorkout}
        />
      </PageTransition>
    ),
    workout: currentPlan ? (
      <PageTransition viewKey="work">
        <ActiveWorkout
          todayPlan={currentPlan}
          history={history}
          profile={profile}
          onFinish={handleFinishWorkout}
          onCancel={() => setView('dashboard')}
        />
      </PageTransition>
    ) : null,
    settings: (
      <PageTransition viewKey="set">
        <Settings profile={profile} setProfile={setProfile} onReset={handleReset} />
      </PageTransition>
    ),
    assessment: (
      <PageTransition viewKey="asses">
        <FitnessAssessment
          onComplete={(data: Partial<UserProfile>) => {
            setProfile({ ...profile, ...data } as UserProfile);
            setView('dashboard');
          }}
        />
      </PageTransition>
    ),
    guide: (
      <PageTransition viewKey="gui">
        <BeginnerGuide onComplete={() => setView('dashboard')} />
      </PageTransition>
    ),
    history: (
      <PageTransition viewKey="hist">
        <DetailedHistory workouts={history} profile={profile} onStartWorkout={handleStartWorkout} />
      </PageTransition>
    ),
    feedback: (
      <PageTransition viewKey="feed">
        <PostWorkoutFeedback
          onSubmit={handleFeedbackSubmit}
          profile={profile}
          workoutData={workoutData}
        />
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
        <CycleReview
          history={history}
          onClose={() => setView('dashboard')}
          onGenerateNewPlan={() => {
            setView('dashboard');
            window.dispatchEvent(new CustomEvent('OPEN_WEEKLY_PLAN'));
          }}
        />
      </PageTransition>
    ),
    nutrition: (
      <PageTransition viewKey="nutrition">{buildNutritionView(profile, setProfile)}</PageTransition>
    ),
    devices: (
      <PageTransition viewKey="devices">
        <DeviceManager />
      </PageTransition>
    ),
    rewards: (
      <PageTransition viewKey="rewards">
        <RewardsStore onClose={() => setView('dashboard')} />
      </PageTransition>
    ),
    backup: (
      <PageTransition viewKey="backup">
        <BackupScreen />
      </PageTransition>
    ),
    walkingcoach: (
      <PageTransition viewKey="walkingcoach">
        <WalkingCoachScreen onClose={() => setView('dashboard')} onFinish={handleInstantSave} />
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
    ),
    coach: (
      <PageTransition viewKey="coach">
        <ProactiveMessageList />
      </PageTransition>
    ),
  };
}
