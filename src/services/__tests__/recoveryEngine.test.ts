// @ts-nocheck
// src/services/__tests__/recoveryEngine.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateReadinessScore } from '../recoveryEngine';
import * as schemaDb from '../../db/schema';

// ─── INJETA O MOCK DO BROWSER AQUI ───
globalThis.IDBKeyRange = {
  bound: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn(),
  only: vi.fn(),
} as any;
// ─────────────────────────────────────

vi.mock('../../db/schema', () => ({
  getRecoveryMetricsByDateRange: vi.fn(),
  getDB: vi.fn(),
  addRecoveryMetric: vi.fn(),
}));

describe('Recovery Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve calcular readiness com dados excelentes', async () => {
    // Mock HRV metrics: baseline 50, latest 60 (melhoria)
    (schemaDb.getRecoveryMetricsByDateRange as any).mockImplementation((start, end, type) => {
      if (type === 'hrv') {
        return [
          { value: 50, timestamp: Date.now() - 2 * 86400000 },
          { value: 60, timestamp: Date.now() },
        ];
      }
      if (type === 'sleep') return [{ value: 8, timestamp: Date.now() }];
      if (type === 'soreness') return [{ value: 1, timestamp: Date.now() }];
      if (type === 'mood') return [{ value: 9, timestamp: Date.now() }];
      return [];
    });

    // Mock Fatigue (tx and index)
    const mockGetAll = vi.fn().mockResolvedValue([]); // sem volume crónico/agudo = sem fadiga
    const mockIndex = { getAll: mockGetAll };
    const mockStore = { index: () => mockIndex };
    const mockTx = { store: mockStore };
    (schemaDb.getDB as any).mockResolvedValue({
      transaction: () => mockTx,
    });

    const report = await calculateReadinessScore();
    
    expect(report.score).toBeGreaterThan(80);
    expect(report.status).toBe('excellent');
    expect(report.trainingAdjustment.loadModifier).toBeGreaterThanOrEqual(1.0);
  });

  it('deve sinalizar risco crítico com HRV baixo e má noite de sono', async () => {
    // Mock HRV metrics: baseline 60, latest 40 (declínio > 30%)
    (schemaDb.getRecoveryMetricsByDateRange as any).mockImplementation((start, end, type) => {
      if (type === 'hrv') {
        return [
          { value: 60, timestamp: Date.now() - 2 * 86400000 },
          { value: 40, timestamp: Date.now() },
        ];
      }
      if (type === 'sleep') return [{ value: 3, timestamp: Date.now() }]; // 3h de sono
      if (type === 'soreness') return [{ value: 8, timestamp: Date.now() }]; // muita dor
      return [];
    });

    // Mock Fatigue (alto volume agudo)
    const mockGetAll = vi.fn().mockImplementation((range) => {
      // Simplificação: se for agudo, retorna muitos logs
      return [{ weightKg: 100, repsCompleted: 10 }]; // Volume 1000
    });
    const mockIndex = { getAll: mockGetAll };
    const mockStore = { index: () => mockIndex };
    const mockTx = { store: mockStore };
    (schemaDb.getDB as any).mockResolvedValue({
      transaction: () => mockTx,
    });

    const report = await calculateReadinessScore();
    
    expect(report.score).toBeLessThan(50);
    expect(['poor', 'critical']).toContain(report.status);
    expect(report.trainingAdjustment.loadModifier).toBeLessThan(1.0);
  });
});
