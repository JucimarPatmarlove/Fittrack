// src/utils/__tests__/loadCalculator.test.ts
// Testes unitários para o calculador de carga (calculateSuggestedWeight)
// e a fórmula de Epley implícita na prescriptionEngine.

import { describe, expect, it } from 'vitest';
import { type LoadCalculationInput, calculateSuggestedWeight } from '../loadCalculator';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<LoadCalculationInput> = {}): LoadCalculationInput {
  return {
    oneRM: 100,
    targetReps: 10,
    category: 'compound_multi',
    userLevel: 'intermedio',
    age: 30,
    goal: 'hipertrofia',
    injuryModifier: 1.0,
    ...overrides,
  };
}

// ─── SUITE: calculateSuggestedWeight ─────────────────────────────────────────

describe('loadCalculator — calculateSuggestedWeight', () => {
  // ── Base cases ──────────────────────────────────────────────────────────────

  it('deve retornar 0 para exercício de peso corporal', () => {
    const result = calculateSuggestedWeight(makeInput({ category: 'bodyweight' }));
    expect(result).toBe(0);
  });

  it('deve retornar 0 se oneRM for 0 ou negativo', () => {
    expect(calculateSuggestedWeight(makeInput({ oneRM: 0 }))).toBe(0);
    expect(calculateSuggestedWeight(makeInput({ oneRM: -10 }))).toBe(0);
  });

  // ── Arredondamento ao múltiplo de 2.5 ────────────────────────────────────────

  it('deve arredondar o peso ao múltiplo de 2.5 kg mais próximo', () => {
    // Qualquer resultado deve ser múltiplo de 2.5
    for (const oneRM of [80, 100, 120, 150, 200]) {
      const w = calculateSuggestedWeight(makeInput({ oneRM }));
      expect(w % 2.5).toBeCloseTo(0, 5);
    }
  });

  // ── Factores de nível ─────────────────────────────────────────────────────────

  it('iniciante deve ter peso menor que intermédio', () => {
    const beginner = calculateSuggestedWeight(makeInput({ userLevel: 'iniciante' }));
    const intermediate = calculateSuggestedWeight(makeInput({ userLevel: 'intermedio' }));
    expect(beginner).toBeLessThan(intermediate);
  });

  it('avançado deve ter peso maior que intermédio', () => {
    const advanced = calculateSuggestedWeight(makeInput({ userLevel: 'avancado' }));
    const intermediate = calculateSuggestedWeight(makeInput({ userLevel: 'intermedio' }));
    expect(advanced).toBeGreaterThan(intermediate);
  });

  // ── Factor de idade ────────────────────────────────────────────────────────────

  it('atleta com mais de 50 anos deve ter peso menor', () => {
    const youngAthlete = calculateSuggestedWeight(makeInput({ age: 30 }));
    const seniorAthlete = calculateSuggestedWeight(makeInput({ age: 55 }));
    expect(seniorAthlete).toBeLessThan(youngAthlete);
  });

  // ── Factor de objetivo ────────────────────────────────────────────────────────

  it('objetivo força deve dar peso maior que hipertrofia', () => {
    const strength = calculateSuggestedWeight(makeInput({ goal: 'forca', targetReps: 5 }));
    const hypertrophy = calculateSuggestedWeight(
      makeInput({ goal: 'hipertrofia', targetReps: 10 }),
    );
    expect(strength).toBeGreaterThan(hypertrophy);
  });

  it('objetivo resistência deve dar peso menor que hipertrofia', () => {
    const endurance = calculateSuggestedWeight(makeInput({ goal: 'resistencia', targetReps: 15 }));
    const hypertrophy = calculateSuggestedWeight(
      makeInput({ goal: 'hipertrofia', targetReps: 10 }),
    );
    expect(endurance).toBeLessThan(hypertrophy);
  });

  // ── Modificador de lesão ──────────────────────────────────────────────────────

  it('modificador de lesão 0.8 deve reduzir o peso em ~20%', () => {
    const normal = calculateSuggestedWeight(makeInput({ injuryModifier: 1.0 }));
    const injured = calculateSuggestedWeight(makeInput({ injuryModifier: 0.8 }));
    // Peso com lesão deve ser menor
    expect(injured).toBeLessThan(normal);
    // E a redução deve ser aproximadamente 20% (tolerância de 2 múltiplos de 2.5)
    expect(injured).toBeGreaterThan(normal * 0.7);
  });

  // ── Categorias de exercício ───────────────────────────────────────────────────

  it('exercício composto deve ter peso maior que isolamento', () => {
    const compound = calculateSuggestedWeight(
      makeInput({ category: 'compound_multi', oneRM: 100 }),
    );
    const isolation = calculateSuggestedWeight(
      makeInput({ category: 'isolation_multi', oneRM: 100 }),
    );
    expect(compound).toBeGreaterThan(isolation);
  });

  // ── Relação reps-peso (mais reps = menos peso) ───────────────────────────────

  it('menos reps deve sugerir maior carga (relação inversa)', () => {
    const lowReps = calculateSuggestedWeight(makeInput({ targetReps: 4 }));
    const highReps = calculateSuggestedWeight(makeInput({ targetReps: 15 }));
    expect(lowReps).toBeGreaterThan(highReps);
  });

  // ── Caso de referência numérica (Epley-based) ────────────────────────────────

  it('deve calcular peso razoável para 1RM=100kg, 10 reps, intermédio, hipertrofia', () => {
    const result = calculateSuggestedWeight(makeInput({ oneRM: 100 }));
    // Base: 70% de 100kg = 70kg * factor intermédio (0.95) * goal hipertrofia (1.0)
    // = ~66.5kg, arredondado a 67.5kg
    expect(result).toBeGreaterThan(55);
    expect(result).toBeLessThan(80);
  });

  it('deve calcular peso razoável para Barbell Squat (1RM=150kg, força)', () => {
    const result = calculateSuggestedWeight(
      makeInput({
        oneRM: 150,
        targetReps: 4,
        category: 'compound_multi',
        userLevel: 'avancado',
        goal: 'forca',
      }),
    );
    // 150kg * 90% (4 reps) * 1.05 (avancado) * 1.1 (força) ≈ 156kg
    expect(result).toBeGreaterThan(120);
    expect(result).toBeLessThan(175);
  });
});
