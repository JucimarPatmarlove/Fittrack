import { LOAD_PCT, LEVEL_IDX, EXERCISE_LIBRARY, RECOVERY_HOURS, MUSCLE_EMOJIS } from './constants'

export function getLoadRec(exName, goal, level, bw) {
  const pct = LOAD_PCT[exName]
  if (!pct || !pct[goal] || !bw) return null
  const idx = LEVEL_IDX[level] ?? 0
  const kg = Math.round((bw * pct[goal][idx]) / 2.5) * 2.5
  return Math.max(2.5, kg)
}

export function getRepsRec(exName, goal) {
  const presets = {
    hipertrofia:     { sets: 4, repsMin: 8,  repsMax: 12 },
    forca:           { sets: 5, repsMin: 3,  repsMax: 5  },
    perda_peso:      { sets: 3, repsMin: 12, repsMax: 15 },
    condicionamento: { sets: 3, repsMin: 15, repsMax: 20 },
  }
  // Bodyweight/timed exercises
  if (exName === 'Plank') return { sets: 3, repsMin: 30, repsMax: 60 }
  return presets[goal] || presets.condicionamento
}

export function isBodyweight(exName) {
  const bw = LOAD_PCT[exName]
  return bw === null
}

export function calcBMI(kg, cm) {
  if (!kg || !cm || cm <= 0) return null
  return (kg / ((cm / 100) ** 2)).toFixed(1)
}

export function bmiInfo(b) {
  const v = Number(b)
  if (v < 18.5) return { label: 'Abaixo do peso', color: '#4a9ee8' }
  if (v < 25)   return { label: 'Peso normal',    color: '#3dd68c' }
  if (v < 30)   return { label: 'Excesso de peso',color: '#e8a44a' }
  return               { label: 'Obesidade',       color: '#e84a4a' }
}

export function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
export function fmtDuration(s) {
  return `${Math.floor(s / 60)}min ${s % 60}s`
}
export function fmtTotalTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
export function trainedToday(history) {
  return history.some(w => w.date.slice(0, 10) === todayISO())
}

/** Calculate muscle recovery percentages from workout history */
export function calculateRecovery(history, goal) {
  const recoveryH = RECOVERY_HOURS[goal] || 48
  const now = Date.now()

  // Collect all muscles and their last workout time
  const lastWorked = {}
  history.forEach(w => {
    const wTime = new Date(w.date).getTime()
    w.exercises?.forEach(ex => {
      ex.muscles?.forEach(m => {
        if (!lastWorked[m] || wTime > lastWorked[m]) lastWorked[m] = wTime
      })
      // Also look up by exercise name
      const libEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
      libEx?.muscles?.forEach(m => {
        if (!lastWorked[m] || wTime > lastWorked[m]) lastWorked[m] = wTime
      })
    })
  })

  // Main muscle groups to show
  const mainMuscles = ['Peito', 'Dors', 'Quadríceps', 'Isquiotibiais', 'Glúteos', 'Ombros', 'Bíceps', 'Tríceps', 'ABS']

  return mainMuscles.map(muscle => {
    const last = lastWorked[muscle]
    if (!last) return { muscle, recoveryPct: 100, hoursLeft: 0, emoji: MUSCLE_EMOJIS[muscle] || '💪' }
    const hoursElapsed = (now - last) / 3600000
    const pct = Math.min(100, Math.round((hoursElapsed / recoveryH) * 100))
    const hoursLeft = Math.max(0, Math.round(recoveryH - hoursElapsed))
    return { muscle, recoveryPct: pct, hoursLeft, emoji: MUSCLE_EMOJIS[muscle] || '💪' }
  })
}

/** Suggest progressive overload */
export function getProgressionSuggestion(exName, history) {
  const relevantWorkouts = history
    .filter(w => w.exercises?.some(e => e.name === exName))
    .slice(-3)
  if (relevantWorkouts.length < 2) return null

  const last2 = relevantWorkouts.slice(-2)
  const allComplete = last2.every(w => {
    const ex = w.exercises.find(e => e.name === exName)
    return ex?.sets?.length > 0 && ex.sets.every(s => s.reps >= 10)
  })

  if (!allComplete) return null
  const lastEx = last2[last2.length - 1].exercises.find(e => e.name === exName)
  const lastWeight = lastEx?.sets?.[0]?.weight || 0
  return lastWeight > 0 ? lastWeight + 2.5 : null
}
