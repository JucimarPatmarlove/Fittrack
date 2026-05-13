import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../data/constants';
import { GlobalBackground } from '../components/ui/GlobalBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { NeuralFatigue } from '../services/neuralFatigue';
import { useMilestonesStore } from '../stores/useMilestonesStore';

export default function Trends({ history }: any) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const prs = useMilestonesStore((state) => state.personalRecords);

  // 1. Agrupar por semana (últimas 8 semanas)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weeks: { weekStart: Date; weekEnd: Date; volume: number; avgRPE: number; readiness: number; historySlice: any[] }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() || 7) - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekWorkouts = history.filter((w: any) => {
        const d = new Date(w.date);
        return d >= weekStart && d <= weekEnd;
      });
      
      const volume = weekWorkouts.reduce((sum: number, w: any) => sum + (w.totalVolume || 0), 0);
      
      // Calculate Average RPE across all sets in this week's workouts
      let totalRpe = 0;
      let setsWithRpe = 0;
      weekWorkouts.forEach((w: any) => {
          w.exercises?.forEach((ex: any) => {
              ex.sets?.forEach((s: any) => {
                  if (s.rpe) {
                      totalRpe += Number(s.rpe);
                      setsWithRpe++;
                  }
              });
          });
      });
      
      const avgRPE = setsWithRpe > 0 ? totalRpe / setsWithRpe : 0;
      
      // Simulate readiness state AT THE END of that week by feeding history up to that point
      const historyUpToWeek = history.filter((w: any) => new Date(w.date) <= weekEnd);
      const readiness = historyUpToWeek.length > 0 ? NeuralFatigue.calculateReadiness(historyUpToWeek).score : 100;

      weeks.push({ weekStart, weekEnd, volume, avgRPE, readiness, historySlice: weekWorkouts });
    }
    return weeks;
  }, [history]);

  // 2. Dados de PR por exercício convertidos em array
  const exercisePRs = useMemo(() => {
    return Object.entries(prs).map(([name, weight]) => ({
      name,
      weight: Number(weight)
    })).sort((a, b) => b.weight - a.weight);
  }, [prs]);

  const maxVolume = Math.max(...weeklyData.map((w) => w.volume), 1000);
  const maxReadiness = 100;

  // Formatação de datas (ex: 24/05)
  const formatWeek = (start: Date) => {
    return `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const avgRpeGlobal = weeklyData.reduce((sum, w) => sum + w.avgRPE, 0) / (weeklyData.filter(w => w.avgRPE > 0).length || 1);

  return (
    <GlobalBackground>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 18px 120px", display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: 2, color: C.text, margin: 0 }}>
                TENDÊNCIAS <span style={{ color: C.accent }}>📈</span>
            </h1>
        </motion.div>

        {/* Gráfico de Volume Semanal */}
        <GlassCard style={{ padding: 20 }}>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text, margin: "0 0 16px 0", letterSpacing: 1 }}>📊 VOLUME SEMANAL (kg)</h2>
          <div style={{ position: 'relative', height: 180, width: "100%", marginTop: 16 }}>
            <svg viewBox="0 0 360 180" style={{ width: "100%", height: "100%", overflow: 'visible' }}>
              {weeklyData.map((week, idx) => {
                const x = 30 + idx * 38;
                const barHeight = (week.volume / maxVolume) * 120;
                const y = 150 - barHeight;
                return (
                  <motion.rect
                    key={`bar-${idx}`}
                    x={x}
                    y={y}
                    width={22}
                    height={barHeight}
                    fill={C.accent}
                    rx={4}
                    initial={{ height: 0, y: 150 }}
                    animate={{ height: barHeight, y }}
                    transition={{ delay: idx * 0.05, type: 'spring', stiffness: 50 }}
                  />
                );
              })}
              {/* Eixos */}
              <line x1="20" y1="150" x2="340" y2="150" stroke={C.border} strokeWidth="1" />
              <line x1="20" y1="30" x2="20" y2="150" stroke={C.border} strokeWidth="1" />
              {/* Labels eixo X */}
              {weeklyData.map((week, idx) => (
                <text key={`lx-${idx}`} x={30 + idx * 38 + 11} y="168" fontSize="9" fill={C.muted} textAnchor="middle" fontFamily="'DM Mono'">
                  {formatWeek(week.weekStart)}
                </text>
              ))}
            </svg>
          </div>
        </GlassCard>

        {/* Gráfico de Readiness Score */}
        <GlassCard style={{ padding: 20 }}>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text, margin: "0 0 16px 0", letterSpacing: 1 }}>🧠 READINESS SCORE</h2>
          <div style={{ position: 'relative', height: 150, width: "100%", marginTop: 8 }}>
            <svg viewBox="0 0 360 150" style={{ width: "100%", height: "100%", overflow: 'visible' }}>
              {/* Area Sombreada */}
              <polygon
                points={`20,130 ${weeklyData
                  .map((week, idx) => `${30 + idx * 38},${130 - (week.readiness / maxReadiness) * 100}`)
                  .join(' ')} ${30 + (weeklyData.length - 1) * 38},130`}
                fill={`${C.blue}22`}
              />
              {/* Linha da Tendência */}
              <polyline
                points={weeklyData
                  .map((week, idx) => `${30 + idx * 38},${130 - (week.readiness / maxReadiness) * 100}`)
                  .join(' ')}
                fill="none"
                stroke={C.blue}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Pontos */}
              {weeklyData.map((week, idx) => (
                <circle
                  key={`pt-${idx}`}
                  cx={30 + idx * 38}
                  cy={130 - (week.readiness / maxReadiness) * 100}
                  r="4"
                  fill={C.card}
                  stroke={C.blue}
                  strokeWidth="2"
                />
              ))}
              {/* Label de percentagem no último ponto */}
              <text x={30 + (weeklyData.length - 1) * 38} y={130 - (weeklyData[weeklyData.length - 1].readiness / maxReadiness) * 100 - 10} fontSize="10" fill={C.blue} textAnchor="middle" fontWeight="bold">
                  {weeklyData[weeklyData.length - 1].readiness}
              </text>
            </svg>
          </div>
          <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12 }}>
            ↓ Queda significa maior fadiga acumulada.
          </p>
        </GlassCard>

        {/* Evolução de 1RM por exercício (selecionável) */}
        {exercisePRs.length > 0 && (
          <GlassCard style={{ padding: 20 }}>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text, margin: "0 0 16px 0", letterSpacing: 1 }}>🏆 EVOLUÇÃO 1RM (EPLEY)</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {exercisePRs.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => setSelectedExercise(ex.name === selectedExercise ? null : ex.name)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontFamily: "'Inter'",
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedExercise === ex.name ? C.accent : 'rgba(255,255,255,0.05)',
                    color: selectedExercise === ex.name ? '#000' : C.text,
                    border: `1px solid ${selectedExercise === ex.name ? C.accent : C.border}`,
                  }}
                >
                  {ex.name}
                </button>
              ))}
            </div>
            
            <AnimatePresence mode="wait">
              {selectedExercise && (
                <motion.div
                  key={selectedExercise}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', padding: "16px 0" }}
                >
                  <p style={{ fontSize: 44, fontFamily: "'DM Mono'", color: C.accent, margin: 0, lineHeight: 1 }}>
                    {exercisePRs.find(e => e.name === selectedExercise)?.weight || 0} <span style={{ fontSize: 20 }}>kg</span>
                  </p>
                  <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0 0" }}>1RM estimado do Atleta</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!selectedExercise && (
                <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', fontStyle: 'italic' }}>
                    Seleciona um exercício para ver a carga.
                </p>
            )}
          </GlassCard>
        )}

        {/* Mini cards estatísticos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <GlassCard style={{ padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 }}>MÉDIA RPE GERAL</p>
            <p style={{ fontSize: 32, fontFamily: "'Bebas Neue'", color: C.accent, margin: 0 }}>
              {avgRpeGlobal > 0 ? avgRpeGlobal.toFixed(1) : '--'}
            </p>
          </GlassCard>
          <GlassCard style={{ padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 }}>TOTAL TREINOS</p>
            <p style={{ fontSize: 32, fontFamily: "'Bebas Neue'", color: C.blue, margin: 0 }}>
              {history.length}
            </p>
          </GlassCard>
        </div>

        {/* Últimos PRs/Conquistas */}
        {exercisePRs.length > 0 && (
          <GlassCard style={{ padding: 20 }}>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: C.text, margin: "0 0 12px 0", letterSpacing: 1 }}>🎯 TECTO MÁXIMO GLOBAL</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {exercisePRs.slice(0, 5).map((pr, index) => (
                <div key={pr.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: index < 4 ? `1px solid ${C.border}` : 'none', padding: "12px 0" }}>
                    <span style={{ fontSize: 14, color: C.text }}>{pr.name}</span>
                    <span style={{ fontFamily: "'DM Mono'", color: C.accent, fontWeight: 'bold' }}>{pr.weight} kg</span>
                </div>
                ))}
            </div>
          </GlassCard>
        )}

      </div>
    </GlobalBackground>
  );
}
