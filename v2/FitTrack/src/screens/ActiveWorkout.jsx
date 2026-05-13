import { useState } from 'react'
import { EXERCISE_LIBRARY, LOAD_PCT, MUSCLE_EMOJIS, C } from '../data/constants'
import { getLoadRec, getRepsRec, isBodyweight, fmtTime, getProgressionSuggestion } from '../data/utils'
import { useBeep, useWakeLock, useStopwatch } from '../hooks'
import RestTimer from '../components/RestTimer'

export default function ActiveWorkout({ todayPlan, profile, history, onFinish, onCancel }) {
  // Build exercise list from plan names
  const exercises = todayPlan.exercises
    .map(name => {
      const lib = EXERCISE_LIBRARY.find(e => e.name === name)
      return lib ? { ...lib } : { id: name, name, muscles: [], emoji: '🏋️', equipment: '' }
    })

  const [sets, setSets] = useState(() =>
    exercises.map(ex => {
      const rec     = getRepsRec(ex.name, profile.goal)
      const loadRec = getLoadRec(ex.name, profile.goal, profile.level, profile.weight) || 0
      return Array.from({ length: rec.sets }, () => ({ reps: rec.repsMin, weight: loadRec, done: false }))
    })
  )
  const [showTimer, setShowTimer] = useState(false)
  const [openIdx, setOpenIdx] = useState(0)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { beep } = useBeep()
  const elapsed = useStopwatch()
  useWakeLock(true)

  const flat = sets.flat()
  const doneSets = flat.filter(s => s.done).length
  const totalSets = flat.length

  const toggleSet = (ei, si) => {
    setSets(prev => {
      const n = prev.map(e => e.map(s => ({ ...s })))
      if (!n[ei][si].done) { beep(880, 0.07); try { navigator.vibrate?.(50) } catch {} setShowTimer(true) }
      n[ei][si].done = !n[ei][si].done
      return n
    })
  }
  const updateSet = (ei, si, f, v) => setSets(prev => {
    const n = prev.map(e => e.map(s => ({ ...s }))); n[ei][si][f] = Number(v); return n
  })

  const finish = () => onFinish({
    date: new Date().toISOString(), dayLabel: todayPlan.label, duration: elapsed,
    exercises: exercises.map((ex, ei) => ({
      name: ex.name, muscles: ex.muscles,
      sets: sets[ei].filter(s => s.done).map(s => ({ reps: s.reps, weight: s.weight })),
    })).filter(e => e.sets.length > 0),
    totalVolume: flat.filter(s => s.done).reduce((a, s) => a + s.weight * s.reps, 0),
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {showTimer && <RestTimer onClose={() => setShowTimer(false)} />}

      {confirmCancel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,11,15,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: 24 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 26, maxWidth: 300, width: '100%', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2, marginBottom: 8 }}>ABANDONAR?</p>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>O progresso não será guardado.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmCancel(false)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 11, color: C.text, fontWeight: 600 }}>Voltar</button>
              <button onClick={onCancel} style={{ flex: 1, background: C.red, border: 'none', borderRadius: 8, padding: 11, color: '#fff', fontWeight: 700 }}>Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '12px 18px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 3, color: C.muted }}>{todayPlan.label?.toUpperCase()}</p>
            <p style={{ fontFamily: "'DM Mono'", fontSize: 17, color: C.accent }}>{fmtTime(elapsed)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: C.muted }}>{doneSets}/{totalSets}</span>
            <button onClick={() => setShowTimer(true)} style={{ background: C.card, border: `1px solid ${C.accent}`, borderRadius: 7, padding: '6px 11px', color: C.accent, fontSize: 15 }}>⏱</button>
            <button onClick={() => setConfirmCancel(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 11px', color: C.muted, fontSize: 13 }}>✕</button>
          </div>
        </div>
        <div style={{ maxWidth: 480, margin: '9px auto 0', background: C.dim, borderRadius: 2, height: 3 }}>
          <div style={{ width: `${(doneSets/totalSets)*100}%`, height: '100%', background: C.accent, borderRadius: 2, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 18px' }}>
        {exercises.map((ex, ei) => {
          const allDone  = sets[ei].every(s => s.done)
          const isOpen   = openIdx === ei
          const loadRec  = getLoadRec(ex.name, profile.goal, profile.level, profile.weight)
          const repsRec  = getRepsRec(ex.name, profile.goal)
          const isBW     = isBodyweight(ex.name)
          const progSug  = getProgressionSuggestion(ex.name, history)

          return (
            <div key={ei} style={{ background: C.card, border: `1px solid ${allDone ? '#3dd68c55' : C.border}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden', transition: 'border 0.3s' }}>
              <button onClick={() => setOpenIdx(isOpen ? -1 : ei)} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 18 }}>{ex.emoji}</span>
                    <span style={{ color: allDone ? C.green : C.text, fontWeight: 600, fontSize: 14 }}>{ex.name}</span>
                    {allDone && <span style={{ color: C.green, fontSize: 11 }}>✓</span>}
                  </div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 2, marginLeft: 27 }}>
                    {ex.muscles.join(' · ')} · {sets[ei].filter(s=>s.done).length}/{sets[ei].length} séries
                  </div>
                </div>
                <span style={{ color: C.muted, fontSize: 10 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 16px 14px' }}>
                  {/* Rec badge */}
                  {(loadRec || isBW) && repsRec && (
                    <div className="shimmer" style={{ background: C.accentLow, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '10px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 2, color: C.accent, marginBottom: 2 }}>RECOMENDADO PARA TI</p>
                        <p style={{ color: C.text, fontSize: 13 }}>
                          {repsRec.sets}×{repsRec.repsMin}–{repsRec.repsMax} reps
                          {isBW ? ' · Peso corporal' : loadRec ? ` · ~${loadRec}kg` : ''}
                        </p>
                      </div>
                      <span style={{ fontSize: 18 }}>📊</span>
                    </div>
                  )}
                  {/* Progression badge */}
                  {progSug && (
                    <div style={{ background: '#3dd68c15', border: '1px solid #3dd68c44', borderRadius: 8, padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⬆️</span>
                      <p style={{ color: C.green, fontSize: 12, fontWeight: 600 }}>Progressão sugerida: tenta {progSug}kg hoje!</p>
                    </div>
                  )}

                  {/* Col headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr 1fr 38px', gap: 8, marginBottom: 7 }}>
                    {['#','KG','REPS',''].map((h,i) => <div key={i} style={{ color: C.muted, fontSize: 9, fontFamily: "'DM Mono'", textAlign: i>0?'center':'left' }}>{h}</div>)}
                  </div>
                  {sets[ei].map((s, si) => (
                    <div key={si} style={{ display: 'grid', gridTemplateColumns: '26px 1fr 1fr 38px', gap: 8, marginBottom: 7, alignItems: 'center' }}>
                      <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: s.done ? C.green : C.muted }}>{si+1}</div>
                      <input type="number" value={s.weight} onChange={e => updateSet(ei,si,'weight',e.target.value)} disabled={isBW}
                        style={{ background: isBW ? C.dim : C.surface, border: `1px solid ${s.done?C.green+'66':C.border}`, borderRadius: 6, padding: '8px 5px', color: isBW?C.muted:C.text, fontSize: 13, fontFamily: "'DM Mono'", width: '100%', textAlign: 'center' }} />
                      <input type="number" value={s.reps} onChange={e => updateSet(ei,si,'reps',e.target.value)}
                        style={{ background: C.surface, border: `1px solid ${s.done?C.green+'66':C.border}`, borderRadius: 6, padding: '8px 5px', color: C.text, fontSize: 13, fontFamily: "'DM Mono'", width: '100%', textAlign: 'center' }} />
                      <button onClick={() => toggleSet(ei,si)}
                        style={{ background: s.done ? C.green : C.dim, border: 'none', borderRadius: 6, width: 38, height: 36, fontSize: s.done?14:11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.done?'#000':'#555', transition: 'background 0.2s' }}>
                        {s.done ? '✓' : '○'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 18px', background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <button onClick={finish} style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto', background: C.accent, color: '#000', border: 'none', borderRadius: 10, padding: 14, fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2 }}>
          TERMINAR · {doneSets}/{totalSets} SÉRIES
        </button>
      </div>
    </div>
  )
}
