import { useState } from 'react'
import { GOALS, MUSCLE_EMOJIS, C } from '../data/constants'
import { calcBMI, bmiInfo, fmtDuration } from '../data/utils'

// ── HISTORY ───────────────────────────────────────────────────────────────────
export function History({ history }) {
  if (!history.length) return (
    <div style={{ padding: '60px 18px', textAlign: 'center', paddingBottom: 100 }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: C.dim, letterSpacing: 2 }}>SEM HISTÓRICO</p>
      <p style={{ color: C.muted, marginTop: 8, fontSize: 13 }}>Inicia o teu primeiro treino!</p>
    </div>
  )
  return (
    <div style={{ padding: 18, maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2, marginBottom: 16 }}>HISTÓRICO</p>
      {[...history].reverse().map((w, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>
                {new Date(w.date).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
                {w.dayLabel && <span style={{ color: C.accent, marginLeft: 8, fontSize: 12 }}>{w.dayLabel}</span>}
              </p>
              <p style={{ color: C.muted, fontSize: 10, fontFamily: "'DM Mono'", marginTop: 1 }}>{Math.floor(w.duration/60)}min · {w.totalVolume}kg</p>
            </div>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: C.accent }}>{w.exercises?.length} ex.</span>
          </div>
          <div style={{ padding: '7px 14px' }}>
            {w.exercises?.map((ex, j) => (
              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ fontSize: 12 }}>{MUSCLE_EMOJIS[ex.muscles?.[0]] || '🏋️'} {ex.name}</span>
                <span style={{ fontSize: 10, fontFamily: "'DM Mono'", color: C.muted }}>{ex.sets?.length}×{ex.sets?.[0]?.weight||0}kg</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── WORKOUT SUMMARY ───────────────────────────────────────────────────────────
export function WorkoutSummary({ workout, onContinue }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="anim-up" style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>🏆</div>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 42, color: C.accent, letterSpacing: 3, lineHeight: 1 }}>TREINO</p>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 42, letterSpacing: 3, lineHeight: 1, marginBottom: 22, color: C.text }}>CONCLUÍDO</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[{l:'DURAÇÃO',v:fmtDuration(workout.duration)},{l:'EXERCÍCIOS',v:workout.exercises?.length},{l:'VOLUME',v:`${workout.totalVolume}kg`}].map((s,i)=>(
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 6px' }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 17, color: C.accent }}>{s.v}</div>
              <div style={{ color: C.muted, fontSize: 9, fontFamily: "'DM Mono'", letterSpacing: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 18, textAlign: 'left' }}>
          {workout.exercises?.map((ex, i) => (
            <div key={i} style={{ padding: '5px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13 }}>{MUSCLE_EMOJIS[ex.muscles?.[0]] || '🏋️'} {ex.name}</span>
              <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: C.green }}>{ex.sets?.length} ✓</span>
            </div>
          ))}
        </div>
        <button onClick={onContinue} style={{ width: '100%', background: C.accent, color: '#000', border: 'none', borderRadius: 10, padding: 14, fontFamily: "'Bebas Neue'", fontSize: 19, letterSpacing: 2 }}>VER PAINEL</button>
      </div>
    </div>
  )
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
export function Settings({ profile, onReset }) {
  const [confirm, setConfirm] = useState(false)
  const doReset = () => { localStorage.removeItem('ft_profile'); localStorage.removeItem('ft_history'); onReset() }
  const bmiVal  = profile?.height && profile?.weight ? calcBMI(profile.weight, profile.height) : null
  const bmiData = bmiVal ? bmiInfo(bmiVal) : null
  const goal    = GOALS.find(g => g.id === profile?.goal)

  const rows = profile ? [
    {l:'NOME',v:profile.name},
    {l:'OBJETIVO',v:goal?.label||'—'},
    {l:'NÍVEL',v:profile.level},
    {l:'GÉNERO',v:{m:'Masculino',f:'Feminino',nb:'Outro'}[profile.sex]||'—'},
    {l:'ALTURA',v:profile.height?`${profile.height} cm`:'—'},
    {l:'PESO',v:profile.weight?`${profile.weight} kg`:'—'},
    {l:'IMC',v:bmiVal?`${bmiVal} — ${bmiData.label}`:'—',color:bmiData?.color},
  ] : []

  return (
    <div style={{ padding: 18, maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2, marginBottom: 18 }}>DEFINIÇÕES</p>
      {profile && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ padding: '11px 14px', borderBottom: i<rows.length-1?`1px solid ${C.border}`:'none', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: C.muted, letterSpacing: 1 }}>{r.l}</span>
              <span style={{ fontSize: 13, color: r.color||C.text, fontWeight: 500 }}>{r.v}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
        {[{t:'WAKE LOCK',d:'Ecrã activo durante o treino',s:'✓ Auto'},{t:'SOM & VIBRAÇÃO',d:'Alerta no fim de cada descanso',s:'✓ Auto'},{t:'PLANO',d:'Seg–Qui treino · Sex–Dom descanso',s:'4 dias/semana'}].map((item,i,arr)=>(
          <div key={i} style={{ padding: '11px 14px', borderBottom: i<arr.length-1?`1px solid ${C.border}`:'none' }}>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 2, color: C.muted }}>{item.t}</p>
            <p style={{ color: C.text, fontSize: 12, marginTop: 1 }}>{item.d}</p>
            <p style={{ color: C.green, fontSize: 10, marginTop: 1 }}>{item.s}</p>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.red}44`, borderRadius: 12, padding: 14 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 2, color: C.red, marginBottom: 10 }}>ZONA DE PERIGO</p>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} style={{ width: '100%', background: 'transparent', border: `1px solid ${C.red}`, borderRadius: 8, padding: 11, color: C.red, fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2 }}>
            🗑 RESETAR TODOS OS DADOS
          </button>
        ) : (
          <>
            <p style={{ color: C.text, fontSize: 12, marginBottom: 12 }}>Todo o histórico e perfil serão apagados. Tens a certeza?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text, fontWeight: 600, fontSize: 12 }}>Cancelar</button>
              <button onClick={doReset} style={{ flex: 1, background: C.red, border: 'none', borderRadius: 8, padding: 10, color: '#fff', fontWeight: 700, fontSize: 12 }}>Apagar Tudo</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
