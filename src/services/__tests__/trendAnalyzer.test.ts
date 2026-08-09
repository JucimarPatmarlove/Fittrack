// src/services/__tests__/trendAnalyzer.test.ts
// Testes unitários para o motor de análise de tendências.
// Usa vi.mock para simular a base de dados encryptedDb.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SetLog } from '../../db/schema';
import { analyzeExerciseTrend, analyzeMultipleExercises } from '../trendAnalyzer';

// ─── MOCK: encryptedDb ────────────────────────────────────────────────────────
// Simulamos getRecentSetLogsDecrypted para controlar os dados retornados

vi.mock('../../db/encryptedDb', () => ({
  getRecentSetLogsDecrypted: vi.fn(),
}));

// Importar o mock tipado para poder configurar comportamentos
import { getRecentSetLogsDecrypted } from '../../db/encryptedDb';
const mockGetRecentSets = vi.mocked(getRecentSetLogsDecrypted);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Criar SetLogs de teste para um workoutId específico */
function makeSets(workoutId: string, rpeValues: number[], weight = 100, reps = 8): SetLog[] {
  return rpeValues.map((rpe, i) => ({
    id: `set-${workoutId}-${i}`,
    workoutId,
    exerciseName: 'Barbell Bench Press',
    category: 'compound_multi',
    setNumber: i + 1,
    weightKg: weight,
    repsCompleted: reps,
    rpe,
    estimated1RM: weight * (1 + reps / 30),
    timestamp: Date.now() - i * 1000,
  }));
}

// ─── SUITE: analyzeExerciseTrend ─────────────────────────────────────────────

describe('trendAnalyzer — analyzeExerciseTrend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── NO_DATA ─────────────────────────────────────────────────────────────────

  it('deve retornar NO_DATA quando não há séries', async () => {
    mockGetRecentSets.mockResolvedValueOnce([]);

    const result = await analyzeExerciseTrend('Barbell Bench Press');

    expect(result.status).toBe('NO_DATA');
    expect(result.suggestedWeightIncrement).toBe(0);
    expect(result.totalSetsAnalyzed).toBe(0);
    expect(result.message).toBeTruthy();
  });

  it('deve retornar NO_DATA quando séries existem mas faltam dados válidos', async () => {
    // Séries com weightKg=0 (dados incompletos)
    const incompleteSets: SetLog[] = [
      {
        id: 'set-1',
        workoutId: 'w1',
        exerciseName: 'Bench Press',
        category: 'compound_multi',
        setNumber: 1,
        weightKg: 0,
        repsCompleted: 0,
        rpe: 0,
        estimated1RM: 0,
        timestamp: Date.now(),
      },
    ];
    mockGetRecentSets.mockResolvedValueOnce(incompleteSets);

    const result = await analyzeExerciseTrend('Barbell Bench Press');
    expect(result.status).toBe('NO_DATA');
  });

  // ── PROGRESSING (RPE ≤ 7.5) ──────────────────────────────────────────────

  it('deve retornar PROGRESSING quando RPE médio é ≤ 7.5', async () => {
    // Treino com RPE baixo (6, 7, 7) → média = 6.67
    const sets = makeSets('workout-1', [6, 7, 7]);
    mockGetRecentSets.mockResolvedValueOnce(sets);

    const result = await analyzeExerciseTrend('Barbell Bench Press');

    expect(result.status).toBe('PROGRESSING');
    expect(result.suggestedWeightIncrement).toBe(2.5);
    expect(result.avgRpeLastWorkout).toBeCloseTo(6.7, 1);
  });

  it('deve retornar PROGRESSING exactamente no limite de RPE 7.5', async () => {
    const sets = makeSets('workout-1', [7.5, 7.5, 7.5]);
    mockGetRecentSets.mockResolvedValueOnce(sets);

    const result = await analyzeExerciseTrend('Barbell Bench Press');
    expect(result.status).toBe('PROGRESSING');
  });

  // ── FATIGUED (RPE ≥ 9.5) ────────────────────────────────────────────────

  it('deve retornar FATIGUED quando RPE médio é ≥ 9.5', async () => {
    // Treino com RPE máximo (10, 9.5, 10) → média = 9.83
    const sets = makeSets('workout-1', [10, 9.5, 10]);
    mockGetRecentSets.mockResolvedValueOnce(sets);

    const result = await analyzeExerciseTrend('Barbell Bench Press');

    expect(result.status).toBe('FATIGUED');
    expect(result.suggestedWeightIncrement).toBe(-2.5);
    expect(result.avgRpeLastWorkout).toBeGreaterThanOrEqual(9.5);
  });

  it('deve retornar FATIGUED exactamente no limite de RPE 9.5', async () => {
    const sets = makeSets('workout-1', [9.5, 9.5, 9.5]);
    mockGetRecentSets.mockResolvedValueOnce(sets);

    const result = await analyzeExerciseTrend('Barbell Bench Press');
    expect(result.status).toBe('FATIGUED');
  });

  // ── STABLE (7.5 < RPE < 9.5) ────────────────────────────────────────────

  it('deve retornar STABLE quando RPE médio está entre 7.5 e 9.5', async () => {
    // Treino com RPE moderado (8, 8.5, 8) → média = 8.17
    const sets = makeSets('workout-1', [8, 8.5, 8]);
    mockGetRecentSets.mockResolvedValueOnce(sets);

    const result = await analyzeExerciseTrend('Barbell Bench Press');

    expect(result.status).toBe('STABLE');
    expect(result.suggestedWeightIncrement).toBe(0);
  });

  // ── Análise apenas do último treino ──────────────────────────────────────

  it('deve analisar apenas o último workoutId, não séries antigas', async () => {
    // Mistura de treinos: último tem RPE alto, anterior tinha RPE baixo
    const oldSets = makeSets('workout-1', [6, 6.5]); // workoutId 'workout-1' (antigo)
    const newSets = makeSets('workout-2', [10, 10]); // workoutId 'workout-2' (recente)

    // A função retorna por timestamp descendente, então 'workout-2' vem primeiro
    // Como setsByWorkout é um Map, a primeira chave será o último treino
    const allSets = [...newSets, ...oldSets]; // workout-2 primeiro (mais recente)
    mockGetRecentSets.mockResolvedValueOnce(allSets);

    const result = await analyzeExerciseTrend('Barbell Bench Press');
    // Deve analisar só o workout-2 (RPE alto → FATIGUED)
    expect(result.status).toBe('FATIGUED');
  });

  // ── Dados incluem weight e avgWeight ─────────────────────────────────────

  it('deve incluir avgWeightLastWorkout nos resultados', async () => {
    const sets = makeSets('workout-1', [8], 120);
    mockGetRecentSets.mockResolvedValueOnce(sets);

    const result = await analyzeExerciseTrend('Barbell Bench Press');
    expect(result.avgWeightLastWorkout).toBe(120);
  });

  // ── Erro no DB retorna NO_DATA ────────────────────────────────────────────

  it('deve retornar NO_DATA quando a base de dados lança erro', async () => {
    mockGetRecentSets.mockRejectedValueOnce(new Error('IDB connection failed'));

    const result = await analyzeExerciseTrend('Barbell Bench Press');
    expect(result.status).toBe('NO_DATA');
    expect(result.suggestedWeightIncrement).toBe(0);
  });
});

// ─── SUITE: analyzeMultipleExercises ─────────────────────────────────────────

describe('trendAnalyzer — analyzeMultipleExercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve analisar múltiplos exercícios em paralelo', async () => {
    // Configurar respostas diferentes para cada exercício
    mockGetRecentSets
      .mockResolvedValueOnce(makeSets('w1', [6, 7])) // PROGRESSING
      .mockResolvedValueOnce(makeSets('w2', [10, 10])) // FATIGUED
      .mockResolvedValueOnce([]); // NO_DATA

    const exercises = ['Barbell Bench Press', 'Barbell Back Squat', 'Deadlift'];
    const results = await analyzeMultipleExercises(exercises);

    expect(results).toBeInstanceOf(Map);
    expect(results.size).toBe(3);
    expect(results.get('Barbell Bench Press')?.status).toBe('PROGRESSING');
    expect(results.get('Barbell Back Squat')?.status).toBe('FATIGUED');
    expect(results.get('Deadlift')?.status).toBe('NO_DATA');
  });

  it('deve retornar Map vazio para array vazio de exercícios', async () => {
    const results = await analyzeMultipleExercises([]);
    expect(results.size).toBe(0);
  });
});
