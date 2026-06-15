// src/components/dashboard/ClinicalAnalytics.tsx
// Painel de Análise de Fadiga Neural (SFR — Stimulus-to-Fatigue Ratio)
//
// Integra dados reais de:
// - WorkoutSession (histórico de treinos passados como prop)
// - useEffortStore (esforço acumulado semanal)
// - analyzeMultipleExercises (estado FATIGUED/PROGRESSING/STABLE por exercício)
//
// Sem dados hardcoded. Todos os alertas derivam de análise real.

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { C } from '../../data/constants';
import { analyzeMultipleExercises, TrendAnalysis } from '../../services/trendAnalyzer';
import { useEffortStore } from '../../stores/useEffortStore';
import { WorkoutSession } from "../../db/schema";;

// ─── CONSTANTES CLÍNICAS ──────────────────────────────────────────────────────

const MRV_WEEKLY_THRESHOLD = 850;  // Pontos de esforço → máximo volume recuperável
const JUNK_VOLUME_RPE_FLOOR = 5;   // RPE < 5 = volume desnecessário (sem estímulo)
const DELOAD_RPE_CEILING = 9.5;   // RPE ≥ 9.5 = fadiga neural → deload necessário

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface WorkoutMetric {
  label: string;         // Ex: "Sex", "Qui"
  volumeKg: number;      // Total kg levantado
  avgRpe: number;        // RPE médio da sessão
  isJunkVolume: boolean; // RPE < 5 com volume > 0
  date: string;
}

interface ClinicalAnalyticsProps {
  history: WorkoutSession[];
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function ClinicalAnalytics({ history }: ClinicalAnalyticsProps) {

  // ── Dados do store de esforço ────────────────────────────────────────────────
  const weeklyEffortPoints = useEffortStore((s) => s.getTotalEffortLastWeek());

  // ── Estado para análise de tendências (async) ─────────────────────────────
  const [trendsMap, setTrendsMap] = useState<Map<string, TrendAnalysis>>(new Map());
  const [trendsLoading, setTrendsLoading] = useState(true);

  // ── Extrair os 5 exercícios mais frequentes do histórico ─────────────────
  const topExercises = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach(w => {
      w.exercises?.forEach(ex => {
        if (ex.name) counts.set(ex.name, (counts.get(ex.name) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);
  }, [history]);

  // ── Carregar análise de tendências ───────────────────────────────────────
  useEffect(() => {
    if (topExercises.length === 0) {
      setTrendsLoading(false);
      return;
    }
    let mounted = true;
    setTrendsLoading(true);
    analyzeMultipleExercises(topExercises).then(map => {
      if (mounted) { setTrendsMap(map); setTrendsLoading(false); }
    }).catch(() => {
      if (mounted) setTrendsLoading(false);
    });
    return () => { mounted = false; };
  }, [topExercises]);

  // ── Métricas dos últimos 7 treinos ────────────────────────────────────────
  const workoutMetrics = useMemo((): WorkoutMetric[] => {
    const last7 = [...history].slice(0, 7).reverse();
    return last7.map(w => {
      // Preferir avgRPE pré-calculado (se existir no payload)
      const preCalcRpe = (w as any).avgRPE;
      if (preCalcRpe && preCalcRpe > 0) {
        return {
          label: new Date(w.date).toLocaleDateString('pt-PT', { weekday: 'short' }),
          volumeKg: w.totalVolume || 0,
          avgRpe: Math.round(preCalcRpe * 10) / 10,
          isJunkVolume: preCalcRpe < JUNK_VOLUME_RPE_FLOOR && (w.totalVolume || 0) > 500,
          date: w.date,
        };
      }
      // Fallback: calcular RPE médio a partir dos sets
      let totalRpe = 0;
      let rpeCount = 0;
      w.exercises?.forEach(ex => {
        ex.sets?.forEach(s => {
          const rpeVal = s.rpe;
          if (rpeVal && rpeVal > 0) {
            totalRpe += Number(rpeVal);
            rpeCount++;
          }
        });
      });
      const avgRpe = rpeCount > 0 ? totalRpe / rpeCount : 0;

      return {
        label: new Date(w.date).toLocaleDateString('pt-PT', { weekday: 'short' }),
        volumeKg: w.totalVolume || 0,
        avgRpe: Math.round(avgRpe * 10) / 10,
        isJunkVolume: avgRpe > 0 && avgRpe < JUNK_VOLUME_RPE_FLOOR && w.totalVolume > 500,
        date: w.date,
      };
    });
  }, [history]);

  // ── Derivar alertas clínicos ──────────────────────────────────────────────
  const fatiguedExercises = useMemo(() =>
    Array.from(trendsMap.entries())
      .filter(([, t]) => t.status === 'FATIGUED')
      .map(([name]) => name),
    [trendsMap]
  );

  const progressingExercises = useMemo(() =>
    Array.from(trendsMap.entries())
      .filter(([, t]) => t.status === 'PROGRESSING')
      .map(([name]) => name),
    [trendsMap]
  );

  const mrvWarning = weeklyEffortPoints > MRV_WEEKLY_THRESHOLD * 0.8;
  const hasJunkVolume = workoutMetrics.some(m => m.isJunkVolume);
  const maxVolume = Math.max(...workoutMetrics.map(m => m.volumeKg), 1);

  // ── Estado de deload necessário ────────────────────────────────────────────
  const needsDeload = fatiguedExercises.length >= 2;

  if (history.length < 3) {
    return (
      <GlassCard style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: C.text, margin: '0 0 8px', letterSpacing: 1 }}>
          🧬 ANÁLISE DE FADIGA NEURAL (SFR)
        </h2>
        <p style={{ fontSize: 12, color: C.muted, margin: 0, fontStyle: 'italic' }}>
          Completa pelo menos 3 treinos para ativar a análise clínica de fadiga.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={{ padding: 20, marginBottom: 20 }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text, margin: 0, letterSpacing: 1 }}>
            🧬 ANÁLISE DE FADIGA NEURAL <span style={{ color: C.accent }}>(SFR)</span>
          </h2>
          <p style={{ fontSize: 10, color: C.muted, margin: '2px 0 0', letterSpacing: 0.5 }}>
            Stimulus-to-Fatigue Ratio • Últimos {workoutMetrics.length} treinos
          </p>
        </div>
        {/* Badge de esforço semanal */}
        <div style={{
          background: mrvWarning ? 'rgba(232,200,74,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${mrvWarning ? 'rgba(232,200,74,0.4)' : C.border}`,
          borderRadius: 8,
          padding: '4px 10px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 9, color: C.muted, margin: 0, letterSpacing: 0.5 }}>ESFORÇO/SEM</p>
          <p style={{ fontSize: 16, fontFamily: "'DM Mono'", color: mrvWarning ? C.accent : C.text, margin: 0, fontWeight: 'bold' }}>
            {Math.round(weeklyEffortPoints)}
          </p>
        </div>
      </div>

      {/* ── Gráfico: Volume + RPE por sessão ──────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <svg viewBox={`0 0 ${workoutMetrics.length * 48} 120`} style={{ width: '100%', height: 110, overflow: 'visible' }}>
          {workoutMetrics.map((m, i) => {
            const x = i * 48 + 4;
            const barH = maxVolume > 0 ? (m.volumeKg / maxVolume) * 80 : 0;
            const barY = 85 - barH;
            const rpeY = m.avgRpe > 0 ? 85 - (m.avgRpe / 10) * 80 : null;

            // Cor da barra: vermelho se junk volume, amarelo se alto, verde normal
            const barColor = m.isJunkVolume
              ? '#e84a4a'
              : (m.avgRpe >= DELOAD_RPE_CEILING ? '#e8c84a' : C.accent + 'cc');

            return (
              <g key={i}>
                {/* Barra de volume */}
                <motion.rect
                  x={x + 2}
                  y={barY}
                  width={30}
                  height={barH}
                  rx={3}
                  fill={barColor}
                  initial={{ height: 0, y: 85 }}
                  animate={{ height: barH, y: barY }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 60 }}
                />
                {/* Ponto de RPE */}
                {rpeY !== null && (
                  <motion.circle
                    cx={x + 17}
                    cy={rpeY}
                    r={4}
                    fill={m.avgRpe >= DELOAD_RPE_CEILING ? '#e84a4a' : m.avgRpe <= 7.5 ? '#38b000' : C.accent}
                    stroke={C.bg}
                    strokeWidth={1.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.06 + 0.3 }}
                  />
                )}
                {/* Label eixo X */}
                <text x={x + 17} y={105} fontSize={9} fill={C.muted} textAnchor="middle" fontFamily="'DM Mono'">
                  {m.label}
                </text>
              </g>
            );
          })}
          {/* Linha de eixo */}
          <line x1={0} y1={85} x2={workoutMetrics.length * 48} y2={85} stroke={C.border} strokeWidth={0.5} />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 2 }}>
          <span style={{ fontSize: 9, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, background: C.accent + 'cc', borderRadius: 2, display: 'inline-block' }} />
            Volume
          </span>
          <span style={{ fontSize: 9, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: '#38b000', borderRadius: '50%', display: 'inline-block' }} />
            RPE Médio
          </span>
        </div>
      </div>

      {/* ── Alertas Clínicos Dinâmicos ─────────────────────────────────── */}
      <AnimatePresence>

        {/* DELOAD NECESSÁRIO */}
        {!trendsLoading && needsDeload && (
          <motion.div
            key="deload"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              borderLeft: '3px solid #e84a4a',
              background: 'rgba(232,74,74,0.06)',
              borderRadius: '0 8px 8px 0',
              padding: '10px 14px',
              marginBottom: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 'bold', color: '#e84a4a' }}>
              ⚠️ Alerta Biomédico: Deload Recomendado
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f8fafc', lineHeight: 1.4 }}>
              Exercícios em fadiga neural: <strong>{fatiguedExercises.join(', ')}</strong>.
              Reduz carga em 10–15% na próxima sessão.
            </p>
          </motion.div>
        )}

        {/* MRV WARNING */}
        {mrvWarning && !needsDeload && (
          <motion.div
            key="mrv"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              borderLeft: '3px solid #e8c84a',
              background: 'rgba(232,200,74,0.06)',
              borderRadius: '0 8px 8px 0',
              padding: '10px 14px',
              marginBottom: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 'bold', color: '#e8c84a' }}>
              📈 Aproximando-se do MRV
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f8fafc', lineHeight: 1.4 }}>
              Volume semanal em {Math.round((weeklyEffortPoints / MRV_WEEKLY_THRESHOLD) * 100)}% do teu máximo recuperável.
              Considera um deload na próxima semana.
            </p>
          </motion.div>
        )}

        {/* JUNK VOLUME */}
        {hasJunkVolume && (
          <motion.div
            key="junk"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              borderLeft: '3px solid #6b7280',
              background: 'rgba(107,114,128,0.06)',
              borderRadius: '0 8px 8px 0',
              padding: '10px 14px',
              marginBottom: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 'bold', color: '#9ca3af' }}>
              🗑️ Junk Volume Detetado
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f8fafc', lineHeight: 1.4 }}>
              Sessão(ões) com RPE &lt; {JUNK_VOLUME_RPE_FLOOR} e volume significativo.
              Este volume não gera adaptação — aumenta o RPE ou reduz séries.
            </p>
          </motion.div>
        )}

        {/* TUDO BEM */}
        {!trendsLoading && !needsDeload && !mrvWarning && !hasJunkVolume && (
          <motion.div
            key="ok"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              borderLeft: '3px solid #38b000',
              background: 'rgba(56,176,0,0.06)',
              borderRadius: '0 8px 8px 0',
              padding: '10px 14px',
              marginBottom: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 'bold', color: '#38b000' }}>
              ✅ Progressão Saudável
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f8fafc', lineHeight: 1.4 }}>
              Sem sinais de fadiga excessiva ou junk volume. Continua no ritmo actual.
              {progressingExercises.length > 0 && ` ${progressingExercises[0]} pronto para progressão de carga (+2.5kg).`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mini-radar de estado dos exercícios ────────────────────────── */}
      {!trendsLoading && trendsMap.size > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
            Estado por exercício
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Array.from(trendsMap.entries()).map(([name, trend]) => {
              const statusConfig = {
                PROGRESSING: { color: '#38b000', icon: '📈', bg: 'rgba(56,176,0,0.08)' },
                FATIGUED:    { color: '#e84a4a', icon: '📉', bg: 'rgba(232,74,74,0.08)' },
                STABLE:      { color: C.accent,  icon: '⚖️', bg: 'rgba(232,200,74,0.08)' },
                NO_DATA:     { color: C.muted,   icon: '•',  bg: 'rgba(255,255,255,0.03)' },
              }[trend.status];

              return (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: statusConfig.bg,
                    border: `1px solid ${statusConfig.color}33`,
                    fontSize: 10,
                    color: statusConfig.color,
                    fontWeight: 600,
                    maxWidth: '100%',
                  }}
                  title={trend.message}
                >
                  <span>{statusConfig.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                    {name}
                  </span>
                  {trend.avgRpeLastWorkout && (
                    <span style={{ color: C.muted, fontWeight: 400, fontFamily: "'DM Mono'" }}>
                      {trend.avgRpeLastWorkout}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {trendsLoading && (
        <p style={{ fontSize: 11, color: C.muted, margin: 0, fontStyle: 'italic' }}>
          A analisar tendências biométricas...
        </p>
      )}
    </GlassCard>
  );
}
