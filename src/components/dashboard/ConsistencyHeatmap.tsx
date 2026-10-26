import { useCallback, useMemo, useState } from 'react';
import { format, subWeeks, startOfWeek, endOfWeek, addDays } from 'date-fns';

// ── DESIGN TOKENS ────────────────────────────────────────────────────────────

/** Tamanho de cada quadrado (px) */
const CELL_SIZE = 10;

/** Espaçamento entre quadrados (px) */
const CELL_GAP = 2;

/** Raio dos cantos arredondados */
const CELL_RADIUS = 2;

/** Cores por nível de consistência */
const CONSISTENCY_COLORS: Record<number, string> = {
  0: '#1e1e24', // Sem treino - fundo escuro/muted
  1: '#3a7d55', // Leve - verde claro
  2: '#2d5a3e', // Moderado - verde médio
  3: '#1e3a22', // Intenso - verde escuro
};

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface HeatmapDay {
  date: Date;
  workoutCount: number;
  totalVolume: number;
  isCurrent: boolean;
}

interface ConsistencyHeatmapProps {
  /** Histórico de treinos */
  history: any[];
}

interface TooltipData {
  date: Date;
  workoutCount: number;
  totalVolume: number;
  dayLabel: string;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getIntensityLevel(workoutCount: number, totalVolume: number): number {
  if (workoutCount === 0) return 0;
  if (workoutCount === 1 && totalVolume < 3000) return 1;
  if (workoutCount <= 2 && totalVolume < 8000) return 2;
  if (totalVolume < 15000) return 3;
  return 3;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export const ConsistencyHeatmap = ({ history }: ConsistencyHeatmapProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Gerar dados da grelha das últimas 52 semanas (1 ano) ──
  const gridData = useMemo(() => {
    if (!history || history.length === 0) {
      // Retorna grid vazia para 52 semanas (Seg=0 ... Dom=6)
      const weeks: HeatmapDay[][] = [];
      for (let w = 0; w < 52; w++) {
        weeks.push([]);
      }
      return { weeks, allDays: [] };
    }

    // Início: 52 semanas atrás (364 dias)
    const start = subWeeks(today, 51);
    start.setHours(0, 0, 0, 0);
    const startOfFirstWeek = startOfWeek(start, { weekStartsOn: 1 }); // Segunda-feira

    // Fim: final da semana atual
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

    // Workouts por data (agrupado)
    const workoutsByDate = new Map<string, { count: number; volume: number }>();
    for (const w of history) {
      const dStr = String(w.date).slice(0, 10);
      const existing = workoutsByDate.get(dStr) || { count: 0, volume: 0 };
      workoutsByDate.set(dStr, {
        count: existing.count + 1,
        volume: existing.volume + (w.totalVolumeKg || 0),
      });
    }

    // Gera todas as semanas
    const weeks: HeatmapDay[][] = [];
    let currentWeekStart = new Date(startOfFirstWeek);

    while (currentWeekStart <= endOfCurrentWeek) {
      const week: HeatmapDay[] = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const day = addDays(currentWeekStart, dayOffset);
        const dStr = format(day, 'yyyy-MM-dd');
        const workoutData = workoutsByDate.get(dStr);
        week.push({
          date: day,
          workoutCount: workoutData?.count || 0,
          totalVolume: workoutData?.volume || 0,
          isCurrent: day.toDateString() === today.toDateString(),
        });
      }
      weeks.push(week);
      currentWeekStart = addDays(currentWeekStart, 7);
    }

    return { weeks };
  }, [history, today]);

  // ── Stats resumo ──
  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return { totalWorkouts: 0, totalVolume: 0, currentStreak: 0, longestStreak: 0 };
    }

    const totalWorkouts = history.length;
    const totalVolume = history.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);

    // Calcular streaks
    const workoutDates = history.map((w) => String(w.date).slice(0, 10));
    const uniqueDates = [...new Set(workoutDates)].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    // Andar de trás para frente (mais recente primeiro)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const date = new Date(uniqueDates[i] + 'T00:00:00');
      if (i === uniqueDates.length - 1) {
        // Data mais recente
        const daysDiff = Math.floor((yesterday.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          streak = 1;
        }
      } else {
        const prevDate = new Date(uniqueDates[i + 1] + 'T00:00:00');
        const daysDiff = Math.floor((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          streak++;
        } else {
          break;
        }
      }
      longestStreak = Math.max(longestStreak, streak);
    }
    currentStreak = streak;

    return { totalWorkouts, totalVolume, currentStreak, longestStreak };
  }, [history]);

  // ── Tooltip state ──
  const [tooltip, setTooltip] = useState<{ isOpen: boolean; data: TooltipData | null }>({
    isOpen: false,
    data: null,
  });

  const showTooltip = useCallback((data: TooltipData) => {
    setTooltip({ isOpen: true, data });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip({ isOpen: false, data: null });
  }, []);

  // ── Render cell ──
  const renderCell = useCallback(
    (day: HeatmapDay, weekIdx: number, dayIdx: number) => {
      const level = getIntensityLevel(day.workoutCount, day.totalVolume);

      // Tooltip data
      const tooltipData: TooltipData = {
        date: day.date,
        workoutCount: day.workoutCount,
        totalVolume: day.totalVolume,
        dayLabel: format(day.date, "d 'de' LLLL, yyyy"),
      };

      // Determina cor de fundo
      const bgColor = CONSISTENCY_COLORS[level] || CONSISTENCY_COLORS[0];

      // Efeito de glow opcional
      const glow =
        level === 0
          ? 'none'
          : level === 1
          ? '0 0 3px rgba(58, 125, 85, 0.4)'
          : level === 2
          ? '0 0 5px rgba(45, 90, 62, 0.5)'
          : '0 0 8px rgba(30, 58, 34, 0.6)';

      const handleMouseEnter = () => {
        showTooltip(tooltipData);
      };

      const handleMouseLeave = () => {
        hideTooltip();
      };

      return (
        <div
          key={weekIdx * 7 + dayIdx}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            borderRadius: CELL_RADIUS,
            backgroundColor: bgColor,
            boxShadow: glow,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.2s, box-shadow 0.2s',
          }}
          title={
            `${day.workoutCount} treino${day.workoutCount !== 1 ? 's' : ''} · ${day.totalVolume.toLocaleString('pt-PT')} kg · ${format(day.date, 'EEE, dd MMM yyyy')}`
          }
        />
      );
    },
    [showTooltip, hideTooltip]
  );

  // ── Render grid ──
  const renderGrid = useMemo(() => {
    if (!gridData.weeks || gridData.weeks.length === 0) {
      return null;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP }}>
        {/* Labels das semanas (Dom → Sáb) */}
        <div
          style={{
            display: 'flex',
            gap: CELL_GAP,
            marginBottom: CELL_GAP * 2,
            paddingBottom: CELL_GAP,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, i) => (
            <div
              key={i}
              style={{
                minWidth: CELL_SIZE,
                fontSize: 8,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Colunas da grelha */}
        {gridData.weeks.map((week, weekIdx) => {
          // Label do mês no topo da semana
          const firstDay = week[0];
          const monthLabel = firstDay ? format(firstDay.date, "LLL'y") : '';

          return (
            <div
              key={weekIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: CELL_GAP,
              }}
            >
              {/* Label do mês */}
              {monthLabel && (
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {monthLabel}
                </div>
              )}

              {/* 7 quadrados por semana */}
              {week.map((day, dayIdx) => renderCell(day, weekIdx, dayIdx))}
            </div>
          );
        })}
      </div>
    );
  }, [gridData.weeks, renderCell]);

  // ── Tooltip render ──
  const renderTooltip = useMemo(() => {
    if (!tooltip.isOpen || !tooltip.data) return null;

    const { workoutCount, totalVolume, dayLabel } = tooltip.data;

    return (
      <div
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9999,
          background: '#0e1318',
          border: '1px solid rgba(204, 255, 0, 0.25)',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          minWidth: 140,
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#fff',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{dayLabel}</div>
        <div
          style={{
            color: workoutCount > 0 ? '#ccff00' : 'rgba(255,255,255,0.4)',
            fontWeight: 600,
          }}
        >
          {workoutCount === 0
            ? 'Sem treinos'
            : `${workoutCount} treino${workoutCount > 1 ? 's' : ''}`}
          {totalVolume > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              {' '}· {totalVolume.toLocaleString('pt-PT')} kg
            </span>
          )}
        </div>
      </div>
    );
  }, [tooltip]);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '20px 24px',
      }}
    >
      {/* Header com estatísticas */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.2rem',
              letterSpacing: 2,
              color: '#ccff00',
              margin: 0,
            }}
          >
            Consistência Anual
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: '0.7rem' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <strong style={{ color: '#ccff00' }}>
              {stats.totalWorkouts}
            </strong>{' '}treinos
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <strong style={{ color: '#2d5a3e' }}>
              {stats.currentStreak}
            </strong>{' '}dias seguidos
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Recorde:{' '}
            <strong style={{ color: '#fff' }}>
              {stats.longestStreak}
            </strong>
          </span>
        </div>
      </div>

      {/* Grelha de calor */}
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: 8,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ display: 'flex', gap: CELL_GAP, width: 'max-content' }}>
          {/* Primeiro: labels de dia (coluna esquerda) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: CELL_GAP,
              flexShrink: 0,
              paddingTop: 12,
            }}
          >
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, i) => (
              <div
                key={i}
                style={{
                  height: CELL_SIZE,
                  minWidth: CELL_SIZE,
                  fontSize: 7,
                  fontWeight: 600,
                  color:
                    i === 0 || i === 6
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(255, 255, 255, 0.3)',
                  textAlign: 'center',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Depois: grelha de semanas */}
          {renderGrid}
        </div>
      </div>

      {/* Tooltip */}
      {renderTooltip}
    </div>
  );
};