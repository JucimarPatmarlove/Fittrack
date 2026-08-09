import { AnimatePresence, motion } from 'framer-motion';
// @ts-nocheck
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ACTIVITY_TYPES,
  C,
  EQUIPMENT_TYPES,
  EXERCISE_LIBRARY,
  MUSCLE_GROUPS,
} from '../../data/constants';
import { getExerciseMedia } from '../../data/exerciseMedia';

// ── Colour per muscle group ─────────────────────────────────────────────────
const MUSCLE_COLOR: Record<string, string> = {
  Peito: '#e84a4a',
  Dors: '#3dd68c',
  Trapézio: '#3dd68c',
  Quadríceps: '#e8c84a',
  Glúteos: '#f472b6',
  Isquiotibiais: '#fb923c',
  Ombros: '#38bdf8',
  Bíceps: '#60a5fa',
  Tríceps: '#a78bfa',
  ABS: '#fb923c',
  Oblíquos: '#fb923c',
  'Parte inferior das costas': '#3dd68c',
};
const muscleColor = (m: string) => MUSCLE_COLOR[m] ?? '#e8c84a';

// ── Thumbnail component — loads GIF / SVG / emoji fallback ─────────────────
const ExerciseThumb = ({ name, emoji }: { name: string; emoji: string }) => {
  const media = getExerciseMedia(name);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    // Try SVG first (smaller, offline-safe)
    const svgUrl = media.imageUrl.replace('.jpg', '.svg');
    const img = new Image();
    img.src = svgUrl;
    img.onload = () => setSrc(svgUrl);
    img.onerror = () => {
      if (media.gifUrl) {
        const gif = new Image();
        gif.src = media.gifUrl;
        gif.onload = () => setSrc(media.gifUrl);
      }
    };
  }, [name, media.imageUrl, media.gifUrl]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 8,
        background: '#080b0f',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ fontSize: 28 }}>{emoji}</span>
      )}
    </div>
  );
};

// ── View toggle ─────────────────────────────────────────────────────────────
type ViewMode = 'grid' | 'list';

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
  const [view, setView] = useState<ViewMode>('grid');

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchSearch = search === '' || ex.name.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = muscle === 'Todos' || ex.muscles.includes(muscle);
      const matchEquip = equipment === 'Todos os equipamentos' || ex.equipment === equipment;
      const matchType = actType === 'Todos os tipos' || ex.type === actType;
      return matchSearch && matchMuscle && matchEquip && matchType;
    });
  }, [search, muscle, equipment, actType]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleCreate = () => {
    const names = selected
      .map((id) => EXERCISE_LIBRARY.find((e) => e.id === id)?.name)
      .filter(Boolean) as string[];
    onCreateWorkout(names);
  };

  const activeFilters = [
    muscle !== 'Todos' ? muscle : null,
    equipment !== 'Todos os equipamentos' ? equipment : null,
    actType !== 'Todos os tipos' ? actType : null,
  ].filter(Boolean) as string[];

  return (
    <AnimatePresence>
      <div
        style={modalOverlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setOpenFilter(null);
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={modalSheet}
        >
          {/* Drag handle */}
          <div
            style={{
              width: 40,
              height: 5,
              background: '#1e2832',
              borderRadius: 3,
              margin: '12px auto 0',
            }}
          />

          {/* Header */}
          <div style={headerRow}>
            <button onClick={onClose} style={headerBtn(C.blue)}>
              Fechar
            </button>
            <span
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: C.text,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Biblioteca
            </span>
            {/* Grid / List toggle */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['grid', 'list'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    background: view === v ? C.accent : C.card,
                    color: view === v ? '#000' : C.muted,
                    transition: 'all 0.2s',
                  }}
                >
                  {v === 'grid' ? '⊞' : '☰'}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={searchWrap}>
            <span style={{ color: C.muted, fontSize: 16, marginRight: 10 }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar exercícios..."
              style={searchInput}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={filterRow} onClick={() => setOpenFilter(null)}>
            {[
              {
                key: 'muscle' as const,
                label: muscle !== 'Todos' ? muscle : 'Músculos',
                active: muscle !== 'Todos',
              },
              {
                key: 'equipment' as const,
                label: equipment !== 'Todos os equipamentos' ? equipment : 'Equipamento',
                active: equipment !== 'Todos os equipamentos',
              },
              {
                key: 'type' as const,
                label: actType !== 'Todos os tipos' ? actType : 'Tipo',
                active: actType !== 'Todos os tipos',
              },
            ].map((f) => (
              <button
                key={f.key}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenFilter(openFilter === f.key ? null : f.key);
                }}
                style={filterPill(f.active)}
              >
                {f.label} {openFilter === f.key ? '▲' : '▼'}
              </button>
            ))}
          </div>

          {/* Active filter badges */}
          <AnimatePresence>
            {activeFilters.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  padding: '4px 16px',
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  overflow: 'hidden',
                }}
              >
                {activeFilters.map((f) => (
                  <span key={f} style={activeBadge}>
                    {f}
                    <button
                      onClick={() => {
                        if (muscle === f) setMuscle('Todos');
                        if (equipment === f) setEquipment('Todos os equipamentos');
                        if (actType === f) setActType('Todos os tipos');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: C.accent,
                        marginLeft: 6,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dropdown overlays */}
          <AnimatePresence>
            {openFilter && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={dropdownOverlay}
                onClick={() => setOpenFilter(null)}
              >
                <div style={dropdown} onClick={(e) => e.stopPropagation()}>
                  {openFilter === 'muscle' &&
                    MUSCLE_GROUPS.map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setMuscle(g);
                          setOpenFilter(null);
                        }}
                        style={dropdownItem(muscle === g)}
                      >
                        {g}
                      </button>
                    ))}
                  {openFilter === 'equipment' &&
                    EQUIPMENT_TYPES.map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setEquipment(g);
                          setOpenFilter(null);
                        }}
                        style={dropdownItem(equipment === g)}
                      >
                        {g}
                      </button>
                    ))}
                  {openFilter === 'type' &&
                    ACTIVITY_TYPES.map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setActType(g);
                          setOpenFilter(null);
                        }}
                        style={dropdownItem(actType === g)}
                      >
                        {g}
                      </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <div
            style={{
              padding: '6px 20px 2px',
              fontSize: 11,
              color: C.muted,
              fontFamily: 'monospace',
            }}
          >
            {filtered.length} exercício{filtered.length !== 1 ? 's' : ''}
            {selected.length > 0 && (
              <span style={{ color: C.accent, marginLeft: 8 }}>
                · {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* ── Exercise list / grid ─────────────────────────────────────────── */}
          <div style={listContainer} onClick={() => setOpenFilter(null)}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                <span style={{ fontSize: 40, opacity: 0.5 }}>🏋️</span>
                <p style={{ fontSize: 16, marginTop: 16 }}>Nenhum exercício encontrado</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setMuscle('Todos');
                    setEquipment('Todos os equipamentos');
                    setActType('Todos os tipos');
                  }}
                  style={{
                    marginTop: 12,
                    background: 'none',
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    padding: '8px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {view === 'grid' ? (
              // ── GRID VIEW ─────────────────────────────────────────────────
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  padding: '8px 16px',
                }}
              >
                {filtered.map((ex, idx) => {
                  const isSel = selected.includes(ex.id);
                  const primaryMuscle = ex.muscles[0] ?? '';
                  const color = muscleColor(primaryMuscle);

                  return (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                      onClick={() => toggle(ex.id)}
                      style={{
                        borderRadius: 12,
                        border: `1.5px solid ${isSel ? color : C.border}`,
                        background: isSel ? `${color}10` : C.card,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: isSel ? `0 0 12px ${color}30` : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ height: 100, position: 'relative' }}>
                        <ExerciseThumb name={ex.name} emoji={ex.emoji} />
                        {/* Muscle badge */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            background: `${color}dd`,
                            borderRadius: 6,
                            padding: '2px 7px',
                            fontSize: 9,
                            color: '#000',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            letterSpacing: 0.3,
                            maxWidth: '80%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {primaryMuscle}
                        </div>
                        {/* Select checkmark */}
                        {isSel && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              color: '#000',
                              fontWeight: 800,
                            }}
                          >
                            ✓
                          </motion.div>
                        )}
                        {/* Bottom gradient */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 40,
                            background: `linear-gradient(to top, ${C.card}, transparent)`,
                            pointerEvents: 'none',
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div style={{ padding: '8px 10px 10px' }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isSel ? color : C.text,
                            margin: 0,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {ex.name}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            color: C.muted,
                            margin: '4px 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ex.equipment}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // ── LIST VIEW ─────────────────────────────────────────────────
              <div>
                {filtered.map((ex, idx) => {
                  const isSel = selected.includes(ex.id);
                  const primaryMuscle = ex.muscles[0] ?? '';
                  const color = muscleColor(primaryMuscle);

                  return (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.25) }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '13px 20px',
                        background: isSel ? `${color}08` : 'none',
                        borderBottom: `1px solid ${C.border}`,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        borderLeft: isSel ? `3px solid ${color}` : '3px solid transparent',
                      }}
                      onClick={() => toggle(ex.id)}
                    >
                      {/* Thumb */}
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 10,
                          flexShrink: 0,
                          border: `1px solid ${isSel ? color + '55' : C.border}`,
                          overflow: 'hidden',
                        }}
                      >
                        <ExerciseThumb name={ex.name} emoji={ex.emoji} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: isSel ? color : C.text,
                            margin: '0 0 3px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ex.name}
                        </p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {ex.muscles.slice(0, 2).map((m, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 10,
                                padding: '2px 7px',
                                borderRadius: 10,
                                background: `${muscleColor(m)}18`,
                                color: muscleColor(m),
                                fontWeight: 600,
                                border: `1px solid ${muscleColor(m)}33`,
                              }}
                            >
                              {m}
                            </span>
                          ))}
                          <span style={{ fontSize: 10, color: C.muted }}>{ex.equipment}</span>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: isSel ? color : 'none',
                          border: isSel ? 'none' : `2px solid ${C.muted}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isSel && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{ color: '#000', fontSize: 13, fontWeight: 800 }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div style={{ height: selected.length > 0 ? 110 : 40 }} />
          </div>

          {/* Bottom action bar */}
          <AnimatePresence>
            {selected.length > 0 && (
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                style={bottomBar}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    onClick={() => setSelected([])}
                    style={{
                      background: 'none',
                      border: `1px solid ${C.border}`,
                      color: C.muted,
                      padding: '14px 16px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Limpar
                  </button>
                  <button onClick={handleCreate} style={{ ...createBtn, flex: 1 }}>
                    ADICIONAR {selected.length} EXERCÍCIO{selected.length !== 1 ? 'S' : ''}
                  </button>
                </div>
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
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'flex-end',
  zIndex: 400,
  backdropFilter: 'blur(4px)',
};
const modalSheet: React.CSSProperties = {
  width: '100%',
  maxHeight: '94vh',
  background: C.surface,
  borderRadius: '24px 24px 0 0',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderTop: `1px solid ${C.border}`,
  boxShadow: '0 -20px 60px rgba(0,0,0,0.8)',
};
const headerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 20px 10px',
};
const headerBtn = (color: string): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  fontSize: 15,
  color,
  fontWeight: 600,
  padding: '4px 8px',
  cursor: 'pointer',
});
const searchWrap: React.CSSProperties = {
  margin: '6px 16px',
  background: C.card,
  borderRadius: 14,
  border: `1px solid ${C.border}`,
  padding: '11px 16px',
  display: 'flex',
  alignItems: 'center',
};
const searchInput: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  color: C.text,
  fontSize: 15,
  outline: 'none',
};
const filterRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '6px 16px',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  flexShrink: 0,
};
const filterPill = (active: boolean): React.CSSProperties => ({
  whiteSpace: 'nowrap',
  flexShrink: 0,
  background: active ? C.accent : C.card,
  color: active ? '#000' : C.text,
  border: active ? 'none' : `1px solid ${C.border}`,
  borderRadius: 20,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
});
const dropdownOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 50,
  background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(4px)',
};
const dropdown: React.CSSProperties = {
  position: 'absolute',
  top: 160,
  left: 16,
  right: 16,
  background: C.surface,
  borderRadius: 16,
  border: `1px solid ${C.border}`,
  maxHeight: '52vh',
  overflowY: 'auto',
  boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
  zIndex: 51,
};
const dropdownItem = (active: boolean): React.CSSProperties => ({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  background: active ? `${C.accent}18` : 'none',
  border: 'none',
  borderBottom: `1px solid ${C.border}40`,
  padding: '14px 20px',
  color: active ? C.accent : C.text,
  fontSize: 15,
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
});
const listContainer: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  position: 'relative',
};
const activeBadge: React.CSSProperties = {
  background: `${C.accent}18`,
  color: C.accent,
  border: `1px solid ${C.accent}44`,
  borderRadius: 12,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
};
const bottomBar: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '12px 16px 28px',
  background: `linear-gradient(to top, ${C.surface} 80%, transparent)`,
};
const createBtn: React.CSSProperties = {
  background: `linear-gradient(90deg, ${C.accent} 0%, #f0a84a 100%)`,
  color: '#000',
  border: 'none',
  cursor: 'pointer',
  borderRadius: 14,
  padding: '16px 20px',
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 18,
  letterSpacing: 2,
  boxShadow: '0 8px 24px rgba(232,200,74,0.35)',
  transition: 'all 0.2s',
};
