import { describe, it, expect, vi } from 'vitest';
import { generateInjuryRiskReport, preWorkoutSafetyCheck } from '../injuryPredictionEngine';
import * as schema from '../../db/schema';

vi.mock('../../db/schema', () => ({
  getRecentSetLogsDecrypted: vi.fn(),
  getRecoveryMetricsByDateRange: vi.fn(),
}));

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
