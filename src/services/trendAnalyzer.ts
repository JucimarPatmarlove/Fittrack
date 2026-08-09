// @ts-nocheck
// src/services/trendAnalyzer.ts
// Motor analítico de tendências — o "cérebro" do Personal Trainer IA
// Analisa o histórico de séries no IndexedDB para sugerir progressive overload ou deload.

import { getRecentSetLogsDecrypted } from '../db/encryptedDb';
import type { SetLog } from '../db/schema';

// ─── TIPOS DE RESULTADO ──────────────────────────────────────────────────────

export type TrendStatus = 'NO_DATA' | 'PROGRESSING' | 'FATIGUED' | 'STABLE';

export interface TrendAnalysis {
  status: TrendStatus;
  message: string;
  suggestedWeightIncrement: number; // Positivo = aumentar, Negativo = deload
  nextRpeTarget?: number;
  avgRpeLastWorkout?: number;
  avgWeightLastWorkout?: number;
  totalSetsAnalyzed: number;
}

// ─── MOTOR ANALÍTICO ─────────────────────────────────────────────────────────

/**
 * Analisa a tendência de um exercício baseada no histórico recente.
 *
 * Lógica de decisão:
 * - RPE médio ≤ 7.5 → PROGRESSING → sugere +2.5kg
 * - RPE médio ≥ 9.5 → FATIGUED → sugere -2.5kg (deload tático)
 * - RPE entre 7.5 e 9.5 → STABLE → manter carga
 *
 * @param exerciseName Nome do exercício a analisar
 * @returns Análise de tendência com sugestão de carga
 */
export async function analyzeExerciseTrend(exerciseName: string): Promise<TrendAnalysis> {
  try {
    const recentSets = await getRecentSetLogsDecrypted(exerciseName, 50);

    if (recentSets.length === 0) {
      return {
        status: 'NO_DATA',
        message: 'Ainda sem histórico. Usa a carga base recomendada.',
        suggestedWeightIncrement: 0,
        totalSetsAnalyzed: 0,
      };
    }

    // Agrupar séries por workoutId para ter visão por sessão
    const setsByWorkout = new Map<string, SetLog[]>();
    for (const set of recentSets) {
      if (!setsByWorkout.has(set.workoutId)) {
        setsByWorkout.set(set.workoutId, []);
      }
      setsByWorkout.get(set.workoutId)!.push(set);
    }

    const workoutIds = Array.from(setsByWorkout.keys());

    if (workoutIds.length === 0) {
      return {
        status: 'NO_DATA',
        message: 'Ainda sem histórico. Usa a carga base recomendada.',
        suggestedWeightIncrement: 0,
        totalSetsAnalyzed: 0,
      };
    }

    // Analisar o último treino (o primeiro no array, pois está ordenado desc)
    const lastWorkoutSets = setsByWorkout.get(workoutIds[0])!;

    // Filtrar séries sem dados válidos
    const validSets = lastWorkoutSets.filter(
      (s) => s.weightKg > 0 && s.repsCompleted > 0 && s.rpe > 0,
    );

    if (validSets.length === 0) {
      return {
        status: 'NO_DATA',
        message: 'Dados do último treino incompletos. Preenche peso, reps e RPE.',
        suggestedWeightIncrement: 0,
        totalSetsAnalyzed: recentSets.length,
      };
    }

    // Média de RPE do último treino
    const avgRpe = validSets.reduce((sum, s) => sum + s.rpe, 0) / validSets.length;
    // Carga média usada
    const avgWeight = validSets.reduce((sum, s) => sum + s.weightKg, 0) / validSets.length;

    // ── Regra do PT: Decisão baseada no RPE médio ──

    if (avgRpe <= 7.5) {
      return {
        status: 'PROGRESSING',
        message: 'Estás a dominar esta carga com boa margem de esforço. Bora aumentar!',
        suggestedWeightIncrement: 2.5,
        nextRpeTarget: 8,
        avgRpeLastWorkout: Math.round(avgRpe * 10) / 10,
        avgWeightLastWorkout: Math.round(avgWeight * 10) / 10,
        totalSetsAnalyzed: recentSets.length,
      };
    }

    if (avgRpe >= 9.5) {
      return {
        status: 'FATIGUED',
        message: 'Esforço máximo na última sessão. Reduz a carga para proteger o SNC.',
        suggestedWeightIncrement: -2.5,
        nextRpeTarget: 7.5,
        avgRpeLastWorkout: Math.round(avgRpe * 10) / 10,
        avgWeightLastWorkout: Math.round(avgWeight * 10) / 10,
        totalSetsAnalyzed: recentSets.length,
      };
    }

    // RPE entre 7.5 e 9.5 — zona ideal
    return {
      status: 'STABLE',
      message: 'Mantém o ritmo, consolida a carga antes de subir.',
      suggestedWeightIncrement: 0,
      nextRpeTarget: 8,
      avgRpeLastWorkout: Math.round(avgRpe * 10) / 10,
      avgWeightLastWorkout: Math.round(avgWeight * 10) / 10,
      totalSetsAnalyzed: recentSets.length,
    };
  } catch (error) {
    console.error('[TrendAnalyzer] Erro ao analisar tendência:', error);
    return {
      status: 'NO_DATA',
      message: 'Erro ao ler o histórico. Tenta novamente.',
      suggestedWeightIncrement: 0,
      totalSetsAnalyzed: 0,
    };
  }
}

/**
 * Analisa múltiplos exercícios em batch (útil para dashboard/relatórios).
 */
export async function analyzeMultipleExercises(
  exerciseNames: string[],
): Promise<Map<string, TrendAnalysis>> {
  const results = new Map<string, TrendAnalysis>();

  // Executa em paralelo para melhor performance
  const analyses = await Promise.all(
    exerciseNames.map(async (name) => ({
      name,
      analysis: await analyzeExerciseTrend(name),
    })),
  );

  for (const { name, analysis } of analyses) {
    results.set(name, analysis);
  }

  return results;
}
