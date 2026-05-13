import { useState } from 'react'
import { WEEKLY_PLAN, C } from './data/constants'
import { useLocalStorage } from './hooks'
import ProfileForm from './screens/ProfileForm'
import ActiveWorkout from './screens/ActiveWorkout'
import Dashboard from './screens/Dashboard'
import { History, WorkoutSummary, Settings } from './screens/OtherScreens'
import BottomNav from './components/BottomNav'
import ExerciseLibrary from './components/ExerciseLibrary'

export default function App() {
  const [profile, setProfile] = useLocalStorage('ft_profile', null)
  const [history, setHistory] = useLocalStorage('ft_history', [])
  const [screen,  setScreen]  = useState('dashboard')
  const [lastW,   setLastW]   = useState(null)
  const [activePlan, setActivePlan] = useState(null)
  const [showLibrary, setShowLibrary] = useState(false)

  const today     = new Date().getDay()
  const todayPlan = WEEKLY_PLAN[today] || { label: 'Treino Livre', exercises: [] }

  const handleStartWorkout = (plan) => {
    setActivePlan(plan)
    setScreen('workout')
  }

  const handleFinish = (w) => {
    setHistory(h => [...h, w])
    setLastW(w)
    setActivePlan(null)
    setScreen('summary')
  }

  const handleReset = () => {
    setProfile(null)
    setHistory([])
    setScreen('dashboard')
  }

  const handleLibraryCreate = (exerciseNames) => {
    setShowLibrary(false)
    if (exerciseNames.length > 0) {
      handleStartWorkout({ label: 'Treino Personalizado', exercises: exerciseNames })
    }
  }

  // Routes
  if (!profile) return <ProfileForm onComplete={setProfile} />
  if (screen === 'editProfile') return <ProfileForm initial={profile} onComplete={p => { setProfile(p); setScreen('dashboard') }} onCancel={() => setScreen('dashboard')} />
  if (screen === 'workout') return <ActiveWorkout todayPlan={activePlan || todayPlan} profile={profile} history={history} onFinish={handleFinish} onCancel={() => { setActivePlan(null); setScreen('dashboard') }} />
  if (screen === 'summary') return <WorkoutSummary workout={lastW} onContinue={() => setScreen('dashboard')} />

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      {/* Exercise Library modal */}
      {showLibrary && (
        <ExerciseLibrary
          onCreateWorkout={handleLibraryCreate}
          onClose={() => setShowLibrary(false)}
        />
      )}

      {/* Screens */}
      {screen === 'dashboard' && (
        <Dashboard
          profile={profile} history={history}
          onStartWorkout={handleStartWorkout}
          onOpenLibrary={() => setShowLibrary(true)}
          onEditProfile={() => setScreen('editProfile')}
        />
      )}
      {screen === 'history'  && <History history={history} />}
      {screen === 'settings' && <Settings profile={profile} onReset={handleReset} />}

      {/* Bottom pill nav */}
      <BottomNav screen={screen} onNavigate={setScreen} />
    </div>
  )
}
