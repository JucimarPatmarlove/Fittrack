import { useState, useMemo } from 'react'
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, EQUIPMENT_TYPES, ACTIVITY_TYPES, C } from '../data/constants'

export default function ExerciseLibrary({ onCreateWorkout, onClose }) {
  const [search,    setSearch]    = useState('')
  const [muscle,    setMuscle]    = useState('Todos')
  const [equipment, setEquipment] = useState('Todos os equipamentos')
  const [actType,   setActType]   = useState('Todos os tipos')
  const [selected,  setSelected]  = useState([])
  const [openFilter, setOpenFilter] = useState(null) // 'muscle' | 'equipment' | 'type' | null

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter(ex => {
      const matchSearch = search === '' || ex.name.toLowerCase().includes(search.toLowerCase())
      const matchMuscle = muscle === 'Todos' || ex.muscles.includes(muscle)
      const matchEquip  = equipment === 'Todos os equipamentos' || ex.equipment === equipment
      const matchType   = actType === 'Todos os tipos' || ex.type === actType
      return matchSearch && matchMuscle && matchEquip && matchType
    })
  }, [search, muscle, equipment, actType])

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleCreate = () => {
    const names = selected.map(id => EXERCISE_LIBRARY.find(e => e.id === id)?.name).filter(Boolean)
    onCreateWorkout(names)
  }

  const activeFilters = [
    muscle !== 'Todos' ? muscle : null,
    equipment !== 'Todos os equipamentos' ? equipment : null,
    actType !== 'Todos os tipos' ? actType : null,
  ].filter(Boolean)

  return (
    <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) { setOpenFilter(null); onClose() } }}>
      <div style={modalSheet} className="anim-slide">

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2, margin: '10px auto 0' }} />

        {/* Header */}
        <div style={headerRow}>
          <button onClick={onClose} style={headerBtn('#4a9ee8')}>Apagar</button>
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>Biblioteca de exercícios</span>
          <button style={headerBtn('#4a9ee8')}>+</button>
        </div>

        {/* Search */}
        <div style={searchWrap}>
          <span style={{ color: C.muted, fontSize: 15, marginRight: 8 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar"
            style={searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Filter pills */}
        <div style={filterRow} onClick={() => setOpenFilter(null)}>
          <button
            onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === 'muscle' ? null : 'muscle') }}
            style={filterPill(muscle !== 'Todos')}
          >
            {muscle !== 'Todos' ? muscle : 'Todos os grupos musculares'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === 'equipment' ? null : 'equipment') }}
            style={filterPill(equipment !== 'Todos os equipamentos')}
          >
            {equipment}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === 'type' ? null : 'type') }}
            style={filterPill(actType !== 'Todos os tipos')}
          >
            {actType}
          </button>
        </div>

        {/* Dropdown overlays */}
        {openFilter && (
          <div style={dropdownOverlay} onClick={() => setOpenFilter(null)}>
            <div style={dropdown} onClick={e => e.stopPropagation()}>
              {openFilter === 'muscle' && MUSCLE_GROUPS.map(g => (
                <button key={g} onClick={() => { setMuscle(g); setOpenFilter(null) }} style={dropdownItem(muscle === g)}>
                  {g}
                </button>
              ))}
              {openFilter === 'equipment' && EQUIPMENT_TYPES.map(g => (
                <button key={g} onClick={() => { setEquipment(g); setOpenFilter(null) }} style={dropdownItem(equipment === g)}>
                  {g}
                </button>
              ))}
              {openFilter === 'type' && (
                <>
                  <div style={{ padding: '10px 16px', borderBottom: `1px solid #2a2a2a` }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>Activity Type</span>
                    <span style={{ float: 'right', color: '#888' }}>›</span>
                  </div>
                  {ACTIVITY_TYPES.map(g => (
                    <button key={g} onClick={() => { setActType(g); setOpenFilter(null) }} style={dropdownItem(actType === g)}>
                      {g}
                    </button>
                  ))}
                  <div style={{ padding: '10px 16px', borderBottom: `1px solid #2a2a2a` }}>
                    <span style={{ fontSize: 12, color: '#666', letterSpacing: 0.5 }}>Other Filters</span>
                  </div>
                  {[{ icon: '☆', label: 'Favoritos' }, { icon: '✏️', label: 'Personalizado' }, { icon: '🎙️', label: 'Suportado por IA' }].map(f => (
                    <button key={f.label} style={dropdownItem(false)}>
                      <span style={{ marginRight: 10, fontSize: 14 }}>{f.icon}</span>{f.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Exercise list */}
        <div style={listContainer} onClick={() => setOpenFilter(null)}>
          {/* Active filter badges */}
          {activeFilters.length > 0 && (
            <div style={{ padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {activeFilters.map(f => (
                <span key={f} style={activeBadge}>
                  {f}
                  <button onClick={() => {
                    if (muscle === f) setMuscle('Todos')
                    if (equipment === f) setEquipment('Todos os equipamentos')
                    if (actType === f) setActType('Todos os tipos')
                  }} style={{ background: 'none', border: 'none', color: '#fff', marginLeft: 4, fontSize: 11 }}>✕</button>
                </span>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted }}>
              <p style={{ fontSize: 16 }}>Nenhum exercício encontrado</p>
            </div>
          )}

          {filtered.map(ex => {
            const isSel = selected.includes(ex.id)
            return (
              <div key={ex.id} style={exerciseRow(isSel)} onClick={() => toggle(ex.id)}>
                {/* Thumbnail */}
                <div style={exThumb}>
                  <span style={{ fontSize: 22 }}>{ex.emoji}</span>
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 2 }}>{ex.name}</p>
                  <p style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ex.muscles.join(' | ')}
                  </p>
                </div>
                {/* Checkbox */}
                <div style={checkbox(isSel)}>
                  {isSel && <span style={{ color: '#000', fontSize: 12, fontWeight: 800 }}>✓</span>}
                </div>
              </div>
            )
          })}
          <div style={{ height: selected.length > 0 ? 80 : 20 }} />
        </div>

        {/* Bottom action */}
        {selected.length > 0 && (
          <div style={bottomBar}>
            <button onClick={handleCreate} style={createBtn}>
              Adicionar {selected.length} exercício{selected.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'flex-end', zIndex: 400,
}
const modalSheet = {
  width: '100%', maxHeight: '95vh',
  background: '#111418', borderRadius: '20px 20px 0 0',
  display: 'flex', flexDirection: 'column',
  overflow: 'hidden',
}
const headerRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 16px 8px',
}
const headerBtn = (color) => ({
  background: 'none', border: 'none', fontSize: 15,
  color, fontWeight: 600, padding: '4px 0',
})
const searchWrap = {
  margin: '8px 16px', background: '#1e2227', borderRadius: 12,
  padding: '10px 14px', display: 'flex', alignItems: 'center',
}
const searchInput = {
  flex: 1, background: 'none', border: 'none', color: C.text,
  fontSize: 16, fontFamily: 'Barlow',
}
const filterRow = {
  display: 'flex', gap: 8, padding: '8px 16px 4px',
  overflowX: 'auto', scrollbarWidth: 'none',
}
const filterPill = (active) => ({
  whiteSpace: 'nowrap', flexShrink: 0,
  background: active ? '#ffffff' : '#2a2e35',
  color: active ? '#000' : C.text,
  border: 'none', borderRadius: 20,
  padding: '8px 14px', fontSize: 13, fontWeight: 600,
})
const dropdownOverlay = {
  position: 'absolute', inset: 0, zIndex: 50,
}
const dropdown = {
  position: 'absolute', top: 140, left: 16, right: 16,
  background: '#1e2227', borderRadius: 14,
  maxHeight: '60vh', overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  zIndex: 51,
}
const dropdownItem = (active) => ({
  display: 'block', width: '100%', textAlign: 'left',
  background: active ? '#e8c84a22' : 'none',
  border: 'none', borderBottom: '1px solid #2a2a2a',
  padding: '14px 16px', color: active ? C.accent : C.text,
  fontSize: 15, fontWeight: active ? 600 : 400,
})
const listContainer = {
  flex: 1, overflowY: 'auto',
  position: 'relative',
}
const exerciseRow = (selected) => ({
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 16px',
  background: selected ? '#e8c84a0a' : 'none',
  borderBottom: '1px solid #1a1e24',
})
const exThumb = {
  width: 52, height: 52, borderRadius: 10,
  background: '#1e2227', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const checkbox = (checked) => ({
  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
  background: checked ? C.accent : 'none',
  border: checked ? 'none' : '2px solid #3a3f48',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})
const activeBadge = {
  background: '#e8c84a33', color: C.accent, border: '1px solid #e8c84a55',
  borderRadius: 12, padding: '4px 10px', fontSize: 11, fontWeight: 600,
  display: 'flex', alignItems: 'center',
}
const bottomBar = {
  position: 'absolute', bottom: 0, left: 0, right: 0,
  padding: '12px 16px 24px',
  background: 'linear-gradient(to top, #111418 80%, transparent)',
}
const createBtn = {
  width: '100%', background: C.accent, color: '#000', border: 'none',
  borderRadius: 14, padding: '16px', fontFamily: "'Bebas Neue'",
  fontSize: 18, letterSpacing: 2,
}
