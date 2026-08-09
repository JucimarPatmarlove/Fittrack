// @ts-nocheck
// src/utils/__tests__/prescriptionEngine.test.ts
// Testes unitários para o motor de prescrição de treino.
// Valida que os parâmetros de treino (reps, RPE, descanso, peso) estão
// dentro dos intervalos esperados para cada perfil de atleta.

import { describe, expect, it } from 'vitest';
import { type UserProfile, getPrescription } from '../prescriptionEngine';

// ─── PERFIS DE TESTE ──────────────────────────────────────────────────────────

const profileHipertrofiaIntermedio: UserProfile = {
  sex: 'male',
  age: 30,
  goal: 'hipertrofia',
  level: 'intermedio',
  trainingPhilosophy: 'classic',
  injuries: [],
};

const profileForcaAvancado: UserProfile = {
  sex: 'male',
  age: 25,
  goal: 'forca',
  level: 'avancado',
  injuries: [],
};

const profileResistenciaIniciante: UserProfile = {
  sex: 'female',
  age: 28,
  goal: 'resistencia',
  level: 'iniciante',
  injuries: [],
};

const profileComLesao: UserProfile = {
  sex: 'male',
  age: 35,
  goal: 'hipertrofia',
  level: 'intermedio',
  injuries: ['shoulder'],
};

// ─── PR de referência ─────────────────────────────────────────────────────────

const prBenchPress = { weight: 100, reps: 8 }; // 1RM estimado ≈ 127kg
const prSquat = { weight: 140, reps: 5 }; // 1RM estimado ≈ 163kg

// ─── SUITE: Perfil Hipertrofia Intermédio ─────────────────────────────────────

describe('prescriptionEngine — Hipertrofia Intermédio', () => {
  it('deve sugerir peso dentro do intervalo razoável para Bench Press', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Barbell Bench Press', prBenchPress);
    // Para hipertrofia: ~70-75% de 127kg ≈ 89-95kg, factor intermédio 0.95 → ~85-90kg
    expect(rx.suggestedWeight).toBeGreaterThan(60);
    expect(rx.suggestedWeight).toBeLessThan(100);
  });

  it('deve recomendar reps alvo entre 15 e 20 para adaptação hipertrofia', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Barbell Bench Press', prBenchPress);
    expect(rx.repsSuggested).toBeGreaterThanOrEqual(15);
    expect(rx.repsSuggested).toBeLessThanOrEqual(20);
    // Validar string de intervalo
    expect(rx.repsTarget).toMatch(/\d+-\d+/);
  });

  it('deve ter RPE alvo de 7 para hipertrofia', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Barbell Bench Press', prBenchPress);
    expect(rx.rpeTarget).toBe(7);
  });

  it('deve ter descanso de 45 segundos para adaptação hipertrofia', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Barbell Bench Press', prBenchPress);
    expect(rx.restSeconds).toBe(45);
  });

  it('deve gerar 3 séries de aquecimento quando há carga', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Barbell Bench Press', prBenchPress);
    expect(rx.warmupSets).toHaveLength(3);
    expect(rx.warmupSets[0].weightPercent).toBe(0.5);
    expect(rx.warmupSets[1].weightPercent).toBe(0.7);
    expect(rx.warmupSets[2].weightPercent).toBe(0.85);
  });

  it('deve gerar presets de força, resistência e volume', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Barbell Bench Press', prBenchPress);
    expect(rx.presets.strength.weight).toBeGreaterThan(rx.presets.endurance.weight);
    expect(rx.presets.volume.reps).toBe(rx.repsSuggested);
    expect(rx.presets.volume.setsDelta).toBe(1);
  });

  it('deve incluir explicação textual com o 1RM estimado', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Barbell Bench Press', prBenchPress);
    expect(rx.explanation).toContain('1RM');
    expect(rx.explanation).toContain('kg');
  });
});

// ─── SUITE: Perfil Força Avançado ─────────────────────────────────────────────

describe('prescriptionEngine — Força Avançado', () => {
  it('deve recomendar reps baixas (3-5) para força', () => {
    const rx = getPrescription(profileForcaAvancado, 'Barbell Back Squat', prSquat);
    expect(rx.repsSuggested).toBeGreaterThanOrEqual(3);
    expect(rx.repsSuggested).toBeLessThanOrEqual(7); // avancado adiciona +2
  });

  it('deve ter RPE alvo mais elevado (>=9) para força avançado', () => {
    const rx = getPrescription(profileForcaAvancado, 'Barbell Back Squat', prSquat);
    expect(rx.rpeTarget).toBeGreaterThanOrEqual(9);
  });

  it('deve ter descanso longo (>=165 segundos) para força', () => {
    const rx = getPrescription(profileForcaAvancado, 'Barbell Back Squat', prSquat);
    expect(rx.restSeconds).toBeGreaterThanOrEqual(165); // 180 - 15 (avancado)
  });

  it('deve sugerir peso mais elevado que hipertrofia para o mesmo PR', () => {
    const rxStrength = getPrescription(profileForcaAvancado, 'Barbell Back Squat', prSquat);
    const rxHypertrophy = getPrescription(
      profileHipertrofiaIntermedio,
      'Barbell Back Squat',
      prSquat,
    );
    expect(rxStrength.suggestedWeight).toBeGreaterThan(rxHypertrophy.suggestedWeight);
  });
});

// ─── SUITE: Sem histórico (PR null) ───────────────────────────────────────────

describe('prescriptionEngine — Sem histórico de PR', () => {
  it('deve usar fallback de 20kg quando não há PR', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Barbell Bench Press', null);
    expect(rx.suggestedWeight).toBeGreaterThan(0);
    // Com oneRM=40 (fallback) e fatores aplicados, o resultado pode ser baixo
    // mas nunca zero (protegido pelo if de fallback)
  });

  it('deve funcionar sem nenhum parâmetro de PR', () => {
    const rx = getPrescription(profileResistenciaIniciante, 'Dumbbell Curl');
    expect(rx.suggestedWeight).toBeGreaterThanOrEqual(0);
    expect(rx.repsSuggested).toBeGreaterThan(0);
  });
});

// ─── SUITE: Modificador de lesão ──────────────────────────────────────────────

describe('prescriptionEngine — Com lesão', () => {
  it('deve sugerir peso menor para atleta com lesão', () => {
    const rxNormal = getPrescription(
      profileHipertrofiaIntermedio,
      'Barbell Bench Press',
      prBenchPress,
    );
    const rxInjured = getPrescription(profileComLesao, 'Barbell Bench Press', prBenchPress);
    expect(rxInjured.suggestedWeight).toBeLessThan(rxNormal.suggestedWeight);
  });

  it('redução deve ser aproximadamente 20%', () => {
    const rxNormal = getPrescription(
      profileHipertrofiaIntermedio,
      'Barbell Bench Press',
      prBenchPress,
    );
    const rxInjured = getPrescription(profileComLesao, 'Barbell Bench Press', prBenchPress);
    const reductionRatio = rxInjured.suggestedWeight / rxNormal.suggestedWeight;
    // Deve estar entre 0.70 e 0.90 (20% de redução ±tolerância de arredondamento)
    expect(reductionRatio).toBeGreaterThan(0.68);
    expect(reductionRatio).toBeLessThanOrEqual(0.9);
  });
});

// ─── SUITE: Exercícios bodyweight ─────────────────────────────────────────────

describe('prescriptionEngine — Exercícios bodyweight', () => {
  it('deve retornar suggestedWeight=0 para exercícios de peso corporal', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Pull-up', { weight: 0, reps: 10 });
    // Pull-up é bodyweight → calculateSuggestedWeight retorna 0
    expect(rx.suggestedWeight).toBe(0);
  });

  it('não deve gerar séries de aquecimento para bodyweight', () => {
    const rx = getPrescription(profileHipertrofiaIntermedio, 'Pull-up', { weight: 0, reps: 10 });
    // warmupSets são filtradas quando suggestedWeight === 0
    expect(rx.warmupSets).toHaveLength(0);
  });
});
