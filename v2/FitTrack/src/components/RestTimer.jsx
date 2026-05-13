import { useState, useEffect, useRef } from 'react'
import { useBeep } from '../hooks'
import { fmtTime } from '../data/utils'
import { C } from '../data/constants'

const PRESETS = [30, 60, 90, 120, 180]
const R = 68, CIRC = 2 * Math.PI * R

export default function RestTimer({ onClose }) {
  const [preset, setPreset] = useState(90)
  const [sec, setSec] = useState(90)
  const [running, setRunning] = useState(true)
  const firedRef = useRef(false)
  const { beep, beepDone } = useBeep()

  const isDone = sec <= 0, isCrit = sec > 0 && sec <= 5
  const pct = Math.max(0, Math.min(1, (preset - sec) / preset))
  const dash = CIRC * (1 - pct)

  useEffect(() => {
    if (!running || isDone) return
    const t = setTimeout(() => setSec(s => {
      if (s <= 4 && s > 1) beep(640 + (4 - s) * 60, 0.07)
      if (s === 1) beep(880, 0.09)
      return s - 1
    }), 1000)
    return () => clearTimeout(t)
  }, [sec, running, isDone, beep])

  useEffect(() => {
    if (isDone && !firedRef.current) {
      firedRef.current = true
      beepDone()
      try { navigator.vibrate?.([180, 80, 180, 80, 350]) } catch {}
    }
  }, [isDone, beepDone])

  const pick = p => { setPreset(p); setSec(p); setRunning(true); firedRef.current = false }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,11,15,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 5, color: C.muted, marginBottom: 20 }}>DESCANSO</p>
      <svg width={186} height={186}>
        <circle cx={93} cy={93} r={R} fill="none" stroke={C.dim} strokeWidth={7} />
        <circle cx={93} cy={93} r={R} fill="none"
          stroke={isDone ? C.green : isCrit ? C.red : C.accent}
          strokeWidth={7} strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={dash}
          transform="rotate(-90 93 93)"
          style={{ transition: isDone ? 'none' : 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
        <text x={93} y={87} textAnchor="middle"
          fill={isDone ? C.green : isCrit ? C.red : C.text}
          fontSize={isDone ? 26 : 40} fontFamily="Bebas Neue" letterSpacing={2}>
          {isDone ? 'GO!' : fmtTime(sec)}
        </text>
        <text x={93} y={108} textAnchor="middle" fill={C.muted} fontSize={10} fontFamily="DM Mono">
          {isDone ? 'vai lá 💪' : `${preset}s`}
        </text>
      </svg>
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        {PRESETS.map(p => (
          <button key={p} onClick={() => pick(p)}
            style={{ background: preset === p ? C.accentLow : C.card, border: `1px solid ${preset === p ? C.accent : C.border}`, borderRadius: 6, padding: '6px 11px', color: preset === p ? C.accent : C.muted, fontSize: 11, fontFamily: "'DM Mono'" }}>
            {p}s
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={() => setRunning(r => !r)}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 18px', color: C.text, fontWeight: 600, fontSize: 13 }}>
          {running ? '⏸ Pausar' : '▶ Continuar'}
        </button>
        <button onClick={onClose}
          style={{ background: C.accent, border: 'none', borderRadius: 8, padding: '10px 18px', color: '#000', fontWeight: 700, fontSize: 13 }}>
          ✓ Fechar
        </button>
      </div>
    </div>
  )
}
