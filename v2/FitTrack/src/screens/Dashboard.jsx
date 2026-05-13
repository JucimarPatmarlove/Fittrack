import { useMemo } from 'react'
import { GOALS, WEEKLY_PLAN, REST_DAYS, MUSCLE_EMOJIS, C } from '../data/constants'
import { calcBMI, bmiInfo, fmtTotalTime, trainedToday, calculateRecovery } from '../data/utils'
import RecoveryRing from '../components/RecoveryRing'

export default function Dashboard({ profile, history, onStartWorkout, onOpenLibrary, onEditProfile }) {
  const today     = new Date().getDay()
  const todayPlan = WEEKLY_PLAN[today]
  const isRest    = REST_DAYS.includes(today)
  const didTrain  = trainedToday(history)
  const canTrain  = !isRest && !didTrain

  const goal      = GOALS.find(g => g.id === profile.goal)
  const totalW    = history.length
  const totalV    = history.reduce((a, w) => a + (w.totalVolume || 0), 0)
  const totalT    = history.reduce((a, w) => a + (w.duration || 0), 0)
  const recent    = history.slice(-6)
  const maxV      = Math.max(...recent.map(w => w.totalVolume || 0), 1)

  const bmiVal    = profile.height && profile.weight ? calcBMI(profile.weight, profile.height) : null
  const bmiData   = bmiVal ? bmiInfo(bmiVal) : null

  const recoveryData = useMemo(() => calculateRecovery(history, profile.goal), [history, profile.goal])

  const weekOrder = [1,2,3,4,5,6,0], wL = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
  const last = history.length > 0 ? history[history.length - 1] : null

  return (
    <div style={{ padding: '18px 18px 100px', maxWidth: 480, margin: '0 auto' }}>

      {/* Greeting */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: C.muted, fontSize: 10, fontFamily: "'DM Mono'", letterSpacing: 1 }}>
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </p>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, lineHeight: 1, marginTop: 3 }}>OLÁ, {profile.name.toUpperCase()}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span>{goal?.icon}</span>
            <span style={{ color: goal?.color, fontSize: 12, fontWeight: 600 }}>{goal?.label}</span>
            <span style={{ color: C.muted, fontSize: 11 }}>· {profile.level}</span>
            {bmiVal && <span style={{ color: bmiData.color, fontSize: 11 }}>· IMC {bmiVal}</span>}
          </div>
        </div>
        <button onClick={onEditProfile} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', color: C.muted, fontSize: 15 }}>✏️</button>
      </div>

      {/* Recovery Ring — Motra style */}
      <RecoveryRing recoveryData={recoveryData} />

      {/* Action buttons — Motra style */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={onOpenLibrary}
          style={{ flex: 1, background: '#ffffff', color: '#000', border: 'none', borderRadius: 24, padding: '16px 0', fontSize: 15, fontWeight: 700 }}>
          📚 Biblioteca
        </button>
        <button onClick={() => canTrain && onStartWorkout({ label: todayPlan?.label || 'Treino Livre', exercises: todayPlan?.exercises || [] })}
          disabled={!canTrain}
          style={{ flex: 1, background: canTrain ? C.accent : C.dim, color: canTrain ? '#000' : C.muted, border: 'none', borderRadius: 24, padding: '16px 0', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {isRest ? '💤 Descanso' : didTrain ? '✓ Feito' : '▶ Iniciar'}
        </button>
      </div>

      {/* Corpo card */}
      {profile.height && profile.weight && (
        <div style={{ ...card, display: 'flex', marginBottom: 14 }}>
          {[{ l:'ALTURA', v: profile.height, u:'cm' }, { l:'PESO', v: profile.weight, u:'kg' }].map((s,i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${C.border}`, paddingRight: 12, marginRight: 12 }}>
              <p style={SL}>{s.l}</p>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: C.text }}>{s.v}<span style={{ fontSize: 12, color: C.muted }}>{s.u}</span></p>
            </div>
          ))}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={SL}>IMC</p>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: bmiData?.color }}>{bmiVal}</p>
            <p style={{ color: bmiData?.color, fontSize: 9, marginTop: 1 }}>{bmiData?.label}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[{l:'TREINOS',v:totalW},{l:'VOLUME',v:totalV>0?`${(totalV/1000).toFixed(1)}t`:'0'},{l:'TEMPO',v:totalT>0?fmtTotalTime(totalT):'0m'}].map((s,i)=>(
          <div key={i} style={{ ...card, flexDirection: 'column', textAlign: 'center', padding: '11px 8px' }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.accent }}>{s.v}</div>
            <div style={{ color: C.muted, fontSize: 9, fontFamily: "'DM Mono'", letterSpacing: 1, marginTop: 1 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Minha Semana — Motra style */}
      <div style={{ ...card, flexDirection: 'column', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Minha Semana</p>
          <span style={{ color: C.muted }}>›</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
          {weekOrder.map((d, i) => {
            const isTd = d === new Date().getDay()
            const isR  = REST_DAYS.includes(d)
            const hasW = history.some(w => new Date(w.date).getDay() === d && new Date(w.date) > new Date(Date.now() - 7*86400000))
            const dayDate = new Date(); dayDate.setDate(dayDate.getDate() - dayDate.getDay() + d)
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isTd ? '#fff' : hasW ? C.green : C.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isTd ? '#000' : hasW ? '#000' : C.muted, fontWeight: isTd ? 700 : 500, fontSize: 13 }}>
                  {hasW && !isTd ? '✓' : dayDate.getDate()}
                </div>
                <span style={{ fontSize: 9, fontFamily: "'DM Mono'", color: isTd ? C.text : isR ? C.dim : C.muted }}>{wL[i]}</span>
              </div>
            )
          })}
        </div>
        {/* Week stats */}
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: `1px solid ${C.border}`, paddingTop: 16, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, color: C.orange }}>⚡</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{Math.min(totalW, 1)} <span style={{ fontSize: 11, color: C.muted }}>semanas</span></div>
              <div style={{ fontSize: 11, color: C.muted }}>sequência atual</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, color: C.green }}>🎯</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                {history.filter(w => new Date(w.date) > new Date(Date.now()-7*86400000)).reduce((a,w)=>a+Math.floor(w.duration/60),0)}
                <span style={{ fontSize: 11, color: C.muted }}> / 150 min</span>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>esta semana</div>
            </div>
          </div>
        </div>
      </div>

      {/* Volume chart */}
      {recent.length > 1 && (
        <div style={{ ...card, flexDirection: 'column', marginBottom: 14 }}>
          <p style={{ ...SL, marginBottom: 12 }}>VOLUME — ÚLTIMOS TREINOS</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 64 }}>
            {recent.map((w, i) => {
              const h = Math.max(4, ((w.totalVolume||0)/maxV)*64)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: '100%', height: h, background: i===recent.length-1?C.accent:C.dim, borderRadius: '3px 3px 0 0', transition: 'height 0.5s' }} />
                  <span style={{ fontSize: 7, fontFamily: "'DM Mono'", color: C.muted }}>
                    {new Date(w.date).toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit'})}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Last workout */}
      {last && (
        <div style={{ ...card, flexDirection: 'column' }}>
          <p style={{ ...SL, marginBottom: 10 }}>ÚLTIMO TREINO</p>
          {last.exercises?.slice(0, 3).map((ex, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12 }}>{MUSCLE_EMOJIS[ex.muscles?.[0]] || '🏋️'} {ex.name}</span>
              <span style={{ color: C.muted, fontSize: 11, fontFamily: "'DM Mono'" }}>{ex.sets?.length}×{ex.sets?.[0]?.weight||0}kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex' }
const SL   = { fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 2, color: C.muted, width: '100%' }
