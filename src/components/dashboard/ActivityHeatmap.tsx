import { AnimatePresence, motion } from 'framer-motion';
import {
  eachDayOfInterval,
  format,
  getDay,
  startOfWeek,
  subDays,
} from 'date-fns';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { WorkoutSession } from '../../db/schema';

// ── DESIGN TOKENS ────────────────────────────────────────────────────────────

const CELL_SIZE = 11;
const CELL_GAP = 3;
const CELL_RADIUS = 2;

/** Color grading: slate → emerald → neon lime */
const INTENSITY_COLORS = [
  '#1a1f25', // Nível 0 — Sem treino (slate escuro)
  '#0d3b26', // Nível 1 — Treino leve / recuperação ativa
  '#0f7b42', // Nível 2 — Volume médio / sessão standard
  '#3dd68c', // Nível 3 — Volume alto / sessão intensa
  '#ccff00', // Nível 4 — Extremo / duplo / PR day
] as const;

const INTENSITY_GLOWS = [
  'none',
  'none',
  '0 0 4px rgba(15, 123, 66, 0.3)',
  '0 0 6px rgba(61, 214, 140, 0.4)',
  '0 0 8px rgba(204, 255, 0, 0.5)',
] as const;

/** Dias da semana em PT (Seg → Dom) */
const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const;

/** Meses abreviados em PT */
const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;

// ── TYPES ────────────────────────────────────────────────────────────────────

interface HeatmapProps {
  history: WorkoutSession[];
}

interface TooltipData {
  date: Date;
  count: number;
  volume: number;
  x: number;
  y: number;
}

// ── HELPER: Intensidade baseada em contagem + volume ────────────────────────

function getIntensityLevel(workouts: WorkoutSession[]): number {
  const count = workouts.length;
  if (count === 0) return 0;
  const totalVolume = workouts.reduce(
    (sum, w) => sum + (w.totalVolumeKg || 0),
    0,
  );
  if (count === 1 && totalVolume < 5000) return 1;
  if (count <= 2 && totalVolume < 12000) return 2;
  if (totalVolume < 20000) return 3;
  return 4;
}

// ── HELPER: Calcular streaks ─────────────────────────────────────────────────

function calculateStreaks(
  history: WorkoutSession[],
  allDays: Date[],
): { current: number; longest: number } {
  const workoutDates = new Set<string>();
  for (const w of history) {
    const d = String(w.date).slice(0, 10);
    workoutDates.add(d);
  }

  let current = 0;
  let longest = 0;
  let streak = 0;

  // Walk days from oldest to newest
  for (let i = 0; i < allDays.length; i++) {
    const dStr = format(allDays[i]!, 'yyyy-MM-dd');
    if (workoutDates.has(dStr)) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 0;
    }
  }
  current = streak;

  return { current, longest };
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const ActivityHeatmap = ({ history }: HeatmapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // ── Gerar semanas (Seg → Dom, ~53 semanas) ──
  const { weeks, allDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = startOfWeek(subDays(today, 364), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end: today });

    const result: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    // Pad início se não começar na segunda-feira
    const firstDayIdx = (getDay(days[0]!) + 6) % 7; // 0=Seg, 6=Dom
    for (let i = 0; i < firstDayIdx; i++) week.push(null);

    for (const d of days) {
      week.push(d);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }

    // Pad final
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }

    return { weeks: result, allDays: days };
  }, []);

  // ── Labels dos meses (posição da semana onde o mês muda) ──
  const monthLabels = useMemo(() => {
    const labels = new Map<number, string>();

    weeks.forEach((week, idx) => {
      for (const day of week) {
        if (day && day.getDate() === 1) {
          labels.set(idx, MONTH_LABELS[day.getMonth()]!);
          break;
        }
      }
    });

    // Garantir que o primeiro mês aparece
    if (!labels.has(0)) {
      const firstDay = weeks[0]?.find((d) => d !== null);
      if (firstDay) {
        labels.set(0, MONTH_LABELS[firstDay.getMonth()]!);
      }
    }

    return labels;
  }, [weeks]);

  // ── Estatísticas (Otimizado com useMemo) ──
  const stats = useMemo(() => {
    const totalWorkouts = history.length;
    const { current, longest } = calculateStreaks(history, allDays);
    return { totalWorkouts, currentStreak: current, longestStreak: longest };
  }, [history, allDays]);

  // ── Workouts por data cache (Evita recálculos desnecessários) ──
  const workoutsByDateCache = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const w of history) {
      const dStr = String(w.date).slice(0, 10);
      const list = map.get(dStr) || [];
      list.push(w);
      map.set(dStr, list);
    }
    return map;
  }, [history]);

  const getCachedWorkoutsForDate = useCallback(
    (date: Date) => {
      const dStr = format(date, 'yyyy-MM-dd');
      return workoutsByDateCache.get(dStr) || [];
    },
    [workoutsByDateCache],
  );

  // ── Tooltip handlers (Otimizado com useCallback) ──
  const handleCellEnter = useCallback(
    (e: React.MouseEvent | React.TouchEvent, date: Date) => {
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const workouts = getCachedWorkoutsForDate(date);
      const volume = workouts.reduce(
        (sum, w) => sum + (w.totalVolumeKg || 0),
        0,
      );

      setTooltip({
        date,
        count: workouts.length,
        volume: Math.round(volume),
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    [getCachedWorkoutsForDate],
  );

  const handleCellLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '20px 24px',
        position: 'relative',
      }}
    >
      {/* HEADER: Título + Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.3rem',
              letterSpacing: 2,
              color: '#ccff00',
              margin: 0,
            }}
          >
            RADAR DE CONSISTÊNCIA
          </h3>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            <strong style={{ color: '#ccff00', fontSize: '0.85rem' }}>
              {stats.totalWorkouts}
            </strong>{' '}
            treinos
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            <strong style={{ color: '#3dd68c', fontSize: '0.85rem' }}>
              {stats.currentStreak}
            </strong>{' '}
            dias seguidos
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            Recorde:{' '}
            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>
              {stats.longestStreak}
            </strong>
          </span>
        </div>
      </div>

      {/* HEATMAP GRID (scrollable) */}
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: 8,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ display: 'flex', gap: CELL_GAP, width: 'max-content' }}>
          {/* Day labels column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: CELL_GAP,
              flexShrink: 0,
              paddingTop: 18, // Alinha com o topo da grid (abaixo dos month labels)
            }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{
                  height: CELL_SIZE,
                  width: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 4,
                  fontSize: 9,
                  fontWeight: 600,
                  color:
                    i === 5 || i === 6
                      ? 'rgba(255,255,255,0.25)'
                      : 'rgba(255,255,255,0.4)',
                  fontFamily: "'Inter', sans-serif",
                  userSelect: 'none',
                }}
              >
                {/* Mostrar apenas índices ímpares para não ficar apertado */}
                {i % 2 === 0 ? label : ''}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, weekIdx) => (
            <div
              key={weekIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: CELL_GAP,
              }}
            >
              {/* Month label */}
              <div
                style={{
                  height: 14,
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {monthLabels.get(weekIdx) || ''}
              </div>

              {/* 7 day cells */}
              {week.map((day, dayIdx) => {
                if (!day) {
                  return (
                    <div
                      key={dayIdx}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      }}
                    />
                  );
                }

                const workouts = getCachedWorkoutsForDate(day);
                const level = getIntensityLevel(workouts);
                const cellIndex = weekIdx * 7 + dayIdx;

                return (
                  <motion.div
                    key={dayIdx}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: Math.min(cellIndex * 0.0018, 0.8),
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    onMouseEnter={(e) => handleCellEnter(e, day)}
                    onMouseLeave={handleCellLeave}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleCellEnter(e, day);
                    }}
                    onTouchEnd={handleCellLeave}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: CELL_RADIUS,
                      backgroundColor: INTENSITY_COLORS[level],
                      boxShadow: INTENSITY_GLOWS[level],
                      cursor: 'pointer',
                      transition: 'background-color 0.2s, box-shadow 0.2s',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* LEGEND */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 500,
          }}
        >
          <span>Menos</span>
          {INTENSITY_COLORS.map((color, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: color,
                boxShadow: INTENSITY_GLOWS[i],
              }}
            />
          ))}
          <span>Mais</span>
        </div>

        {stats.currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{
              fontSize: '0.65rem',
              color: '#ccff00',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            <span>🔥</span>
            {stats.currentStreak} dia{stats.currentStreak !== 1 ? 's' : ''} em
            chama
          </motion.div>
        )}
      </div>

      {/* TOOLTIP (fixed positioning for reliability) */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="heatmap-tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: tooltip.x,
              top: tooltip.y - 10,
              transform: 'translate(-50%, -100%)',
              background: '#0e1318',
              border: '1px solid rgba(204, 255, 0, 0.25)',
              borderRadius: 8,
              padding: '8px 12px',
              zIndex: 9999,
              pointerEvents: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              minWidth: 140,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {format(tooltip.date, "d 'de' MMMM, yyyy")}
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color:
                  tooltip.count > 0
                    ? '#ccff00'
                    : 'rgba(255,255,255,0.4)',
                fontWeight: 600,
              }}
            >
              {tooltip.count === 0
                ? 'Sem treinos'
                : `${tooltip.count} treino${tooltip.count > 1 ? 's' : ''}`}
              {tooltip.volume > 0 && (
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {' '}
                  · {tooltip.volume.toLocaleString('pt-PT')} kg
                </span>
              )}
            </div>
            {/* Seta */}
            <div
              style={{
                position: 'absolute',
                bottom: -5,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(204, 255, 0, 0.25)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
