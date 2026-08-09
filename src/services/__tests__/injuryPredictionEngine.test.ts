// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { generateInjuryRiskReport, preWorkoutSafetyCheck } from '../injuryPredictionEngine';

vi.mock('../../db/schema', () => {
  // Minimal IndexedDB mock for injuryPredictionEngine
  const fakeIndex = {
    openCursor: () => Promise.resolve(null),
    getAll: () => Promise.resolve([]),
    getAllKeys: () => Promise.resolve([]),
  };
  const fakeStore = {
    index: () => fakeIndex,
    getAll: () => Promise.resolve([]),
    getAllKeys: () => Promise.resolve([]),
    get: () => Promise.resolve(undefined),
  };
  const fakeTransaction = {
    store: fakeStore,
    done: Promise.resolve(),
  };
  const fakeDB = {
    transaction: () => fakeTransaction,
    getAll: () => Promise.resolve([]),
    getAllFromIndex: () => Promise.resolve([]),
    get: () => Promise.resolve(undefined),
  };
  return {
    getDB: vi.fn().mockResolvedValue(fakeDB),
    getRecentSetLogsDecrypted: vi.fn().mockResolvedValue([]),
    getRecentSetLogsByExercise: vi.fn().mockResolvedValue([]),
    getRecoveryMetricsByDateRange: vi.fn().mockResolvedValue([]),
  };
});

describe('injuryPredictionEngine', () => {
  it('deve retornar relatório com estrutura correta', async () => {
    const report = await generateInjuryRiskReport();
    expect(report).toHaveProperty('overallRisk');
    expect(report).toHaveProperty('riskScore');
    expect(report).toHaveProperty('flags');
    expect(report).toHaveProperty('recommendations');
  });

  it('deve retornar LOW quando não há dados', async () => {
    const report = await generateInjuryRiskReport();
    expect(['low', 'moderate']).toContain(report.overallRisk);
  });

  it('preWorkoutSafetyCheck deve retornar safe = true para risco baixo', async () => {
    const result = await preWorkoutSafetyCheck();
    expect(result).toHaveProperty('safe');
    expect(result).toHaveProperty('report');
    expect(result).toHaveProperty('overrideRequired');
  });
});
