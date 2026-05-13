import { useState } from 'react'
import { C } from '../data/constants'

const R = 100, CIRC = 2 * Math.PI * R

function getColor(pct) {
  if (pct > 80) return '#3dd68c'
  if (pct > 40) return '#e8a44a'
  return '#e84a4a'
}

function getLabel(pct) {
  if (pct > 80) return 'Recuperado'
  if (pct > 40) return 'Em recuperação'
  return 'Fadigado'
}

export default function RecoveryRing({ recoveryData }) {
  const [idx, setIdx] = useState(0)
  if (!recoveryData || recoveryData.length === 0) return null

  const current = recoveryData[idx]
  const pct = current.recoveryPct
  const color = getColor(pct)
  const dash = CIRC * (1 - pct / 100)

  const next = () => setIdx(i => (i + 1) % recoveryData.length)
  const prev = () => setIdx(i => (i - 1 + recoveryData.length) % recoveryData.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 3, color: C.muted, marginBottom: 12 }}>
        RECUPERAÇÃO MUSCULAR
      </p>

      {/* Ring */}
      <div style={{ position: 'relative', width: 240, height: 240, cursor: 'pointer' }} onClick={next}>
        <svg width={240} height={240} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={120} cy={120} r={R} fill="transparent" stroke={C.dim} strokeWidth={18} strokeLinecap="round" />
          {/* Progress */}
          <circle cx={120} cy={120} r={R} fill="transparent"
            stroke={color} strokeWidth={18} strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={dash}
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.4s ease' }} />
        </svg>

        {/* Center text */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: 28 }}>{current.emoji}</span>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, color: C.text, marginTop: 4 }}>
            {current.muscle.toUpperCase()}
          </p>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 48, color: C.text, lineHeight: 1 }}>
            {pct}<span style={{ fontSize: 20 }}>%</span>
          </p>
          <p style={{ color, fontSize: 12, fontWeight: 600, marginTop: 2 }}>{getLabel(pct)}</p>
          <p style={{ color: C.muted, fontSize: 10, marginTop: 4, maxWidth: 100, lineHeight: 1.3 }}>
            {pct > 80 ? 'Pronto para treinar' : current.hoursLeft > 0 ? `${current.hoursLeft}h restantes` : 'Recuperação em curso'}
          </p>
        </div>
      </div>

      {/* Dot pagination */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        {recoveryData.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? C.text : C.dim, border: 'none', padding: 0, transition: 'all 0.3s' }} />
        ))}
      </div>

      {/* Mini muscle summary row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto', width: '100%', padding: '0 4px', scrollbarWidth: 'none' }}>
        {recoveryData.map((m, i) => {
          const c = getColor(m.recoveryPct)
          return (
            <button key={i} onClick={() => setIdx(i)}
              style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: i === idx ? C.card : 'none', border: `1px solid ${i === idx ? C.border : 'transparent'}`, borderRadius: 8, padding: '6px 8px' }}>
              <span style={{ fontSize: 14 }}>{m.emoji}</span>
              <div style={{ width: 20, height: 3, borderRadius: 2, background: C.dim, overflow: 'hidden' }}>
                <div style={{ width: `${m.recoveryPct}%`, height: '100%', background: c, borderRadius: 2 }} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
