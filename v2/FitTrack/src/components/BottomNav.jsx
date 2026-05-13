import { C } from '../data/constants'

const TABS = [
  { id: 'dashboard', icon: '🏋️', label: 'Treino' },
  { id: 'history',   icon: '📈', label: 'Tendências' },
  { id: 'settings',  icon: '👤', label: 'Você' },
]

export default function BottomNav({ screen, onNavigate }) {
  return (
    <div style={pill}>
      {TABS.map(t => {
        const active = screen === t.id
        return (
          <button key={t.id} onClick={() => onNavigate(t.id)} style={tabBtn}>
            <span style={{ fontSize: 20, opacity: active ? 1 : 0.45, filter: active ? 'none' : 'grayscale(80%)' }}>
              {t.icon}
            </span>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#fff' : C.muted, marginTop: 1 }}>
              {t.label}
            </span>
            {active && <div style={activeDot} />}
          </button>
        )
      })}
    </div>
  )
}

const pill = {
  position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
  background: 'rgba(20, 25, 32, 0.88)',
  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 32, padding: '6px 16px',
  display: 'flex', gap: 8,
  boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
  zIndex: 100,
}
const tabBtn = {
  background: 'none', border: 'none',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '8px 14px', gap: 2, position: 'relative',
}
const activeDot = {
  position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
  width: 4, height: 4, borderRadius: '50%', background: '#fff',
}
