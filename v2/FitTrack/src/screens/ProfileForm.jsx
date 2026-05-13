import { useState } from 'react'
import { GOALS, LEVELS, SEX_OPTS, C } from '../data/constants'
import { calcBMI, bmiInfo } from '../data/utils'

const STEPS = ['Nome', 'Objetivo', 'Nível', 'Corpo']

export default function ProfileForm({ initial, onComplete, onCancel }) {
  const isEdit = !!initial
  const [step,   setStep]   = useState(0)
  const [name,   setName]   = useState(initial?.name   || '')
  const [goal,   setGoal]   = useState(initial?.goal   || null)
  const [level,  setLevel]  = useState(initial?.level  || null)
  const [sex,    setSex]    = useState(initial?.sex    || null)
  const [height, setHeight] = useState(initial?.height || '')
  const [weight, setWeight] = useState(initial?.weight || '')

  const canNext = [name.trim().length > 0, !!goal, !!level, !!sex && Number(height) > 0 && Number(weight) > 0][step]
  const finish = () => onComplete({ name: name.trim(), goal, level, sex, height: Number(height), weight: Number(weight) })

  const bmiVal  = Number(height) > 0 && Number(weight) > 0 ? calcBMI(Number(weight), Number(height)) : null
  const bmiData = bmiVal ? bmiInfo(bmiVal) : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: C.bg }}>
      {isEdit && <button onClick={onCancel} style={backBtn}>← Voltar</button>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 4, background: i <= step ? C.accent : C.dim, transition: 'all 0.3s' }} />
            <span style={{ fontSize: 9, fontFamily: "'DM Mono'", color: i === step ? C.accent : C.muted, letterSpacing: 1 }}>{i === step ? s.toUpperCase() : ''}</span>
          </div>
        ))}
      </div>

      <div className="anim-up" key={step} style={{ width: '100%', maxWidth: 400 }}>
        {step === 0 && (
          <>
            <p style={T1}>{isEdit ? 'EDITAR' : 'BEM-VINDO'}</p>
            <p style={T2}>{isEdit ? 'PERFIL' : 'AO FITTRACK'}</p>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="O teu nome..."
              onKeyDown={e => e.key === 'Enter' && canNext && setStep(1)}
              style={inp} />
          </>
        )}
        {step === 1 && (
          <>
            <p style={T1}>QUAL É O</p>
            <p style={T2}>TEU OBJETIVO?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => setGoal(g.id)}
                  style={{ background: goal === g.id ? `${g.color}18` : C.card, border: `1px solid ${goal === g.id ? g.color : C.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                  <span style={{ fontSize: 24 }}>{g.icon}</span>
                  <div>
                    <div style={{ color: goal === g.id ? g.color : C.text, fontWeight: 600, fontSize: 15 }}>{g.label}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{g.desc}</div>
                  </div>
                  {goal === g.id && <span style={{ marginLeft: 'auto', color: g.color }}>✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <p style={T1}>NÍVEL DE</p>
            <p style={T2}>EXPERIÊNCIA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => setLevel(l.id)}
                  style={{ background: level === l.id ? C.accentLow : C.card, border: `1px solid ${level === l.id ? C.accent : C.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: level === l.id ? C.accent : C.text, fontWeight: 600, fontSize: 15 }}>{l.label}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{l.desc}</div>
                  </div>
                  {level === l.id && <span style={{ color: C.accent }}>✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p style={T1}>DADOS</p>
            <p style={T2}>CORPORAIS</p>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>Usados para calcular cargas e IMC</p>
            <p style={FL}>GÉNERO</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {SEX_OPTS.map(s => (
                <button key={s.id} onClick={() => setSex(s.id)}
                  style={{ flex: 1, background: sex === s.id ? C.accentLow : C.card, border: `1px solid ${sex === s.id ? C.accent : C.border}`, borderRadius: 8, padding: '10px 6px', color: sex === s.id ? C.accent : C.muted, fontSize: 12, fontWeight: sex === s.id ? 700 : 400 }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              {[['ALTURA (cm)', height, setHeight, '175'], ['PESO (kg)', weight, setWeight, '75']].map(([label, val, setter, ph]) => (
                <div key={label}>
                  <p style={FL}>{label}</p>
                  <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                    style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', color: C.text, fontSize: 18, fontFamily: "'DM Mono'", textAlign: 'center' }} />
                </div>
              ))}
            </div>
            {bmiVal && (
              <div style={{ background: C.card, border: `1px solid ${bmiData.color}44`, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={FL}>IMC</p>
                  <p style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: bmiData.color }}>{bmiVal}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: bmiData.color, fontSize: 13, fontWeight: 600 }}>{bmiData.label}</p>
                  <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{Number(height)}cm · {Number(weight)}kg</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <button onClick={() => step < 3 ? setStep(s => s + 1) : finish()} disabled={!canNext}
        style={{ marginTop: 28, width: '100%', maxWidth: 400, background: canNext ? C.accent : C.dim, color: canNext ? '#000' : C.muted, border: 'none', borderRadius: 10, padding: 15, fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 2, cursor: canNext ? 'pointer' : 'not-allowed' }}>
        {step < 3 ? 'CONTINUAR →' : isEdit ? 'GUARDAR' : 'COMEÇAR A TREINAR'}
      </button>
    </div>
  )
}

const T1 = { fontFamily: "'Bebas Neue'", fontSize: 38, color: C.accent, letterSpacing: 2, lineHeight: 1, marginBottom: 4 }
const T2 = { fontFamily: "'Bebas Neue'", fontSize: 38, letterSpacing: 2, lineHeight: 1, marginBottom: 22, color: C.text }
const FL = { color: C.muted, fontSize: 11, fontFamily: "'DM Mono'", letterSpacing: 1, marginBottom: 8 }
const inp = { width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '13px 15px', color: C.text, fontSize: 17, fontFamily: 'Barlow' }
const backBtn = { position: 'fixed', top: 20, left: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 13px', color: C.muted, fontSize: 13 }
