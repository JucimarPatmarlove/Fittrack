import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, EQUIPMENT_TYPES, ACTIVITY_TYPES, C } from '../../data/constants';

interface ExerciseLibraryProps {
  onCreateWorkout: (exerciseNames: string[]) => void;
  onClose: () => void;
}

export function ExerciseLibrary({ onCreateWorkout, onClose }: ExerciseLibraryProps) {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('Todos');
  const [equipment, setEquipment] = useState('Todos os equipamentos');
  const [actType, setActType] = useState('Todos os tipos');
  const [selected, setSelected] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<'muscle' | 'equipment' | 'type' | null>(null);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter(ex => {
      const matchSearch = search === '' || ex.name.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = muscle === 'Todos' || ex.muscles.includes(muscle);
      const matchEquip = equipment === 'Todos os equipamentos' || ex.equipment === equipment;
      const matchType = actType === 'Todos os tipos' || ex.type === actType;
      return matchSearch && matchMuscle && matchEquip && matchType;
    });
  }, [search, muscle, equipment, actType]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    const names = selected.map(id => EXERCISE_LIBRARY.find(e => e.id === id)?.name).filter(Boolean) as string[];
    onCreateWorkout(names);
  };

  const activeFilters = [
    muscle !== 'Todos' ? muscle : null,
    equipment !== 'Todos os equipamentos' ? equipment : null,
    actType !== 'Todos os tipos' ? actType : null,
  ].filter(Boolean) as string[];

  return (
    <AnimatePresence>
      <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) { setOpenFilter(null); onClose(); } }}>
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={modalSheet}
        >
          {/* Drag handle */}
          <div style={{ width: 40, height: 5, background: '#333', borderRadius: 3, margin: '12px auto 0' }} />

          {/* Header */}
          <div style={headerRow}>
            <button onClick={onClose} style={headerBtn(C.blue)}>Apagar</button>
            <span style={{ fontWeight: 700, fontSize: 18, color: C.text, fontFamily: "'Outfit', sans-serif" }}>Biblioteca de Exercícios</span>
            <button style={headerBtn(C.blue)}>+</button>
          </div>

          {/* Search */}
          <div style={searchWrap}>
            <span style={{ color: C.muted, fontSize: 16, marginRight: 10 }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar exercícios..."
              style={searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
            )}
          </div>

          {/* Filter pills */}
          <div style={filterRow} onClick={() => setOpenFilter(null)}>
            <button
              onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === 'muscle' ? null : 'muscle'); }}
              style={filterPill(muscle !== 'Todos')}
            >
              {muscle !== 'Todos' ? muscle : 'Todos os músculos'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === 'equipment' ? null : 'equipment'); }}
              style={filterPill(equipment !== 'Todos os equipamentos')}
            >
              {equipment}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === 'type' ? null : 'type'); }}
              style={filterPill(actType !== 'Todos os tipos')}
            >
              {actType}
            </button>
          </div>

          {/* Dropdown overlays */}
          <AnimatePresence>
            {openFilter && (
              <motion.div 
                 initial={{ opacity: 0, y: -10 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: -10 }}
                 style={dropdownOverlay} onClick={() => setOpenFilter(null)}
              >
                <div style={dropdown} onClick={e => e.stopPropagation()}>
                  {openFilter === 'muscle' && MUSCLE_GROUPS.map(g => (
                    <button key={g} onClick={() => { setMuscle(g); setOpenFilter(null); }} style={dropdownItem(muscle === g)}>
                      {g}
                    </button>
                  ))}
                  {openFilter === 'equipment' && EQUIPMENT_TYPES.map(g => (
                    <button key={g} onClick={() => { setEquipment(g); setOpenFilter(null); }} style={dropdownItem(equipment === g)}>
                      {g}
                    </button>
                  ))}
                  {openFilter === 'type' && ACTIVITY_TYPES.map(g => (
                    <button key={g} onClick={() => { setActType(g); setOpenFilter(null); }} style={dropdownItem(actType === g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exercise list */}
          <div style={listContainer} onClick={() => setOpenFilter(null)}>
            {/* Active filter badges */}
            {activeFilters.length > 0 && (
              <div style={{ padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {activeFilters.map(f => (
                  <motion.span key={f} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={activeBadge}>
                    {f}
                    <button onClick={() => {
                      if (muscle === f) setMuscle('Todos');
                      if (equipment === f) setEquipment('Todos os equipamentos');
                      if (actType === f) setActType('Todos os tipos');
                    }} style={{ background: 'none', border: 'none', color: '#fff', marginLeft: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </motion.span>
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                <span style={{ fontSize: 40, opacity: 0.5 }}>🏋️</span>
                <p style={{ fontSize: 16, marginTop: 16 }}>Nenhum exercício encontrado</p>
                <button 
                  onClick={() => { setSearch(''); setMuscle('Todos'); setEquipment('Todos os equipamentos'); setActType('Todos os tipos'); }} 
                  style={{ marginTop: 12, background: 'none', border: `1px solid ${C.border}`, color: C.text, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {filtered.map(ex => {
              const isSel = selected.includes(ex.id);
              return (
                <div key={ex.id} style={exerciseRow(isSel)} onClick={() => toggle(ex.id)}>
                  <div style={exThumb}>
                    <span style={{ fontSize: 24 }}>{ex.emoji}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>{ex.name}</p>
                    <p style={{ fontSize: 13, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ex.muscles.join(' | ')}
                    </p>
                  </div>
                  <div style={checkbox(isSel)}>
                    {isSel && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: '#000', fontSize: 14, fontWeight: 800 }}>✓</motion.span>}
                  </div>
                </div>
              );
            })}
            <div style={{ height: selected.length > 0 ? 100 : 40 }} />
          </div>

          {/* Bottom action */}
          <AnimatePresence>
            {selected.length > 0 && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={bottomBar}>
                <button onClick={handleCreate} style={createBtn}>
                  Adicionar {selected.length} exercício{selected.length !== 1 ? 's' : ''}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'flex-end', zIndex: 400,
};
const modalSheet: React.CSSProperties = {
  width: '100%', maxHeight: '92vh', height: '100%',
  background: C.surface, borderRadius: '24px 24px 0 0',
  display: 'flex', flexDirection: 'column',
  overflow: 'hidden', borderTop: `1px solid ${C.border}`
};
const headerRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 20px 12px',
};
const headerBtn = (color: string): React.CSSProperties => ({
  background: 'none', border: 'none', fontSize: 16,
  color, fontWeight: 600, padding: '4px 8px', cursor: 'pointer'
});
const searchWrap: React.CSSProperties = {
  margin: '8px 20px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
  padding: '12px 16px', display: 'flex', alignItems: 'center',
};
const searchInput: React.CSSProperties = {
  flex: 1, background: 'none', border: 'none', color: C.text,
  fontSize: 16, outline: 'none'
};
const filterRow: React.CSSProperties = {
  display: 'flex', gap: 10, padding: '8px 20px 8px',
  overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0
};
const filterPill = (active: boolean): React.CSSProperties => ({
  whiteSpace: 'nowrap', flexShrink: 0,
  background: active ? '#ffffff' : C.card,
  color: active ? '#000' : C.text,
  border: active ? 'none' : `1px solid ${C.border}`, borderRadius: 24,
  padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  transition: 'all 0.2s'
});
const dropdownOverlay: React.CSSProperties = {
  position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)'
};
const dropdown: React.CSSProperties = {
  position: 'absolute', top: 180, left: 20, right: 20,
  background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`,
  maxHeight: '50vh', overflowY: 'auto',
  boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
  zIndex: 51,
};
const dropdownItem = (active: boolean): React.CSSProperties => ({
  display: 'block', width: '100%', textAlign: 'left',
  background: active ? C.accentLow : 'none',
  border: 'none', borderBottom: `1px solid ${C.border}`,
  padding: '16px 20px', color: active ? C.accent : C.text,
  fontSize: 16, fontWeight: active ? 600 : 400, cursor: 'pointer'
});
const listContainer: React.CSSProperties = {
  flex: 1, overflowY: 'auto', position: 'relative',
};
const exerciseRow = (selected: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 16,
  padding: '16px 20px', cursor: 'pointer',
  background: selected ? 'rgba(232, 200, 74, 0.05)' : 'none',
  borderBottom: `1px solid ${C.border}`,
  transition: 'background 0.2s'
});
const exThumb: React.CSSProperties = {
  width: 56, height: 56, borderRadius: 12,
  background: C.card, flexShrink: 0, border: `1px solid ${C.border}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const checkbox = (checked: boolean): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
  background: checked ? C.accent : 'none',
  border: checked ? 'none' : `2px solid ${C.muted}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s'
});
const activeBadge: React.CSSProperties = {
  background: C.accentLow, color: C.accent, border: `1px solid ${C.accent}`,
  borderRadius: 14, padding: '6px 12px', fontSize: 13, fontWeight: 600,
  display: 'flex', alignItems: 'center',
};
const bottomBar: React.CSSProperties = {
  position: 'absolute', bottom: 0, left: 0, right: 0,
  padding: '16px 20px 32px',
  background: `linear-gradient(to top, ${C.surface} 70%, transparent)`,
};
const createBtn: React.CSSProperties = {
  width: '100%', background: C.accent, color: '#000', border: 'none', cursor: 'pointer',
  borderRadius: 16, padding: '18px', fontFamily: "'Bebas Neue'",
  fontSize: 20, letterSpacing: 2, boxShadow: '0 8px 24px rgba(232, 200, 74, 0.3)'
};
