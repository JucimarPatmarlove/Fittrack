// Testes unitários para Structural Balance (Mapa Muscular)
// Vitest

import { describe, it, expect } from 'vitest';
import {
  evaluateStructuralBalance,
  evaluateRole,
  classifyBalance,
  getBestPerformance,
  BALANCE_TEMPLATES,
  type Role,
  type ExercisePerformance,
  type UserData,
} from './structuralBalance';

// Helper para criar UserData
function createUserData(overrides: Partial<UserData> = {}): UserData {
  return {
    bodyweightKg: 80,
    sex: 'male',
    ...overrides,
  };
}

// Helper para criar ExercisePerformance
function createPerformance(overrides: Partial<ExercisePerformance> = {}): ExercisePerformance {
  return {
    exerciseId: 'bench-press',
    estimated1RM: 100,
    loadKg: 80,
    reps: 10,
    isUnilateral: false,
    ...overrides,
  };
}

describe('classifyBalance — Classificação', () => {
  it('deve retornar BALANCED quando >= 100% do alvo', () => {
    expect(classifyBalance(1.0)).toBe('BALANCED');
    expect(classifyBalance(1.05)).toBe('BALANCED');
    expect(classifyBalance(1.5)).toBe('BALANCED');
  });

  it('deve retornar BORDERLINE quando entre 95% e 100% do alvo', () => {
    expect(classifyBalance(0.95)).toBe('BORDERLINE');
    expect(classifyBalance(0.97)).toBe('BORDERLINE');
    expect(classifyBalance(0.99)).toBe('BORDERLINE');
  });

  it('deve retornar WEAK quando < 95% do alvo', () => {
    expect(classifyBalance(0.94)).toBe('WEAK');
    expect(classifyBalance(0.8)).toBe('WEAK');
    expect(classifyBalance(0.5)).toBe('WEAK');
    expect(classifyBalance(0)).toBe('WEAK');
  });
});

describe('getBestPerformance — Seleção do melhor exercício', () => {
  const userData = createUserData();

  const roleLoadRatio: Role = {
    id: 'push_horizontal',
    name: 'Push Horizontal',
    evaluationMode: 'LOAD_RATIO',
    exerciseIds: ['bench-press', 'db-bench-press', 'push-up'],
    targetPct: 1.0,
  };

  const roleBodyweightRatio: Role = {
    id: 'pull_vertical',
    name: 'Pull Vertical',
    evaluationMode: 'BODYWEIGHT_RATIO',
    exerciseIds: ['pull-up', 'chin-up', 'lat-pulldown'],
    targetPct: 0.85,
  };

  const roleRepCount: Role = {
    id: 'pushups',
    name: 'Push-ups',
    evaluationMode: 'REP_COUNT',
    exerciseIds: ['push-up', 'knee-push-up'],
    repsTarget: 20,
  };

  it('deve retornar o melhor 1RM para LOAD_RATIO', () => {
    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 100 }),
      createPerformance({ exerciseId: 'db-bench-press', estimated1RM: 90 }),
      createPerformance({ exerciseId: 'push-up', estimated1RM: 70 }),
    ];

    const result = getBestPerformance(roleLoadRatio, performances, userData);

    expect(result).not.toBeNull();
    expect(result!.exerciseId).toBe('bench-press');
    expect(result!.value).toBe(100);
    expect(result!.metricType).toBe('LOAD_RATIO');
  });

  it('deve retornar a melhor carga para BODYWEIGHT_RATIO', () => {
    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'pull-up', loadKg: 68 }), // 85% BW
      createPerformance({ exerciseId: 'chin-up', loadKg: 72 }), // 90% BW
      createPerformance({ exerciseId: 'lat-pulldown', loadKg: 60 }),
    ];

    const result = getBestPerformance(roleBodyweightRatio, performances, userData);

    expect(result).not.toBeNull();
    expect(result!.exerciseId).toBe('chin-up');
    expect(result!.value).toBe(72);
    expect(result!.metricType).toBe('BODYWEIGHT_RATIO');
  });

  it('deve retornar as melhores reps para REP_COUNT', () => {
    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'push-up', reps: 15 }),
      createPerformance({ exerciseId: 'knee-push-up', reps: 25 }),
    ];

    const result = getBestPerformance(roleRepCount, performances, userData);

    expect(result).not.toBeNull();
    expect(result!.exerciseId).toBe('knee-push-up');
    expect(result!.value).toBe(25);
    expect(result!.metricType).toBe('REP_COUNT');
  });

  it('deve retornar null quando não há exercícios correspondentes', () => {
    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'squat', estimated1RM: 140 }),
    ];

    const result = getBestPerformance(roleLoadRatio, performances, userData);

    expect(result).toBeNull();
  });

  it('deve retornar null quando todos os valores são zero ou negativos', () => {
    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 0 }),
      createPerformance({ exerciseId: 'db-bench-press', estimated1RM: -10 }),
    ];

    const result = getBestPerformance(roleLoadRatio, performances, userData);

    expect(result).toBeNull();
  });
});

describe('evaluateRole — Avaliação de role individual', () => {
  const userData = createUserData({ bodyweightKg: 80 });

  it('deve avaliar LOAD_RATIO corretamente (ex: pull_horizontal = 100% push_horizontal)', () => {
    const anchorRole: Role = {
      id: 'push_horizontal',
      name: 'Push Horizontal',
      evaluationMode: 'LOAD_RATIO',
      exerciseIds: ['bench-press'],
      targetPct: 1.0,
    };

    const testRole: Role = {
      id: 'pull_horizontal',
      name: 'Pull Horizontal',
      evaluationMode: 'LOAD_RATIO',
      anchorRoleId: 'push_horizontal',
      exerciseIds: ['barbell-row'],
      targetPct: 1.0, // 100% do push
    };

    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 100 }), // âncora = 100kg
      createPerformance({ exerciseId: 'barbell-row', estimated1RM: 100 }),  // pull = 100kg
    ];

    const anchorPerf = getBestPerformance(anchorRole, performances, userData);
    const evaluation = evaluateRole(testRole, performances, userData, anchorPerf?.value);

    expect(evaluation).not.toBeNull();
    expect(evaluation!.classification).toBe('BALANCED');
    expect(evaluation!.currentValue).toBe(1.0); // 100/100
    expect(evaluation!.targetValue).toBe(1.0);
    expect(evaluation!.pctOfTarget).toBe(1.0);
  });

  it('deve classificar BORDERLINE quando pull_horizontal = 97% do push_horizontal', () => {
    const anchorRole: Role = {
      id: 'push_horizontal',
      name: 'Push Horizontal',
      evaluationMode: 'LOAD_RATIO',
      exerciseIds: ['bench-press'],
      targetPct: 1.0,
    };

    const testRole: Role = {
      id: 'pull_horizontal',
      name: 'Pull Horizontal',
      evaluationMode: 'LOAD_RATIO',
      anchorRoleId: 'push_horizontal',
      exerciseIds: ['barbell-row'],
      targetPct: 1.0,
    };

    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 100 }),
      createPerformance({ exerciseId: 'barbell-row', estimated1RM: 97 }), // 97%
    ];

    const anchorPerf = getBestPerformance(anchorRole, performances, userData);
    const evaluation = evaluateRole(testRole, performances, userData, anchorPerf?.value);

    expect(evaluation).not.toBeNull();
    expect(evaluation!.classification).toBe('BORDERLINE');
    expect(evaluation!.currentValue).toBe(0.97);
    expect(evaluation!.pctOfTarget).toBe(0.97);
  });

  it('deve classificar WEAK quando pull_horizontal = 90% do push_horizontal', () => {
    const anchorRole: Role = {
      id: 'push_horizontal',
      name: 'Push Horizontal',
      evaluationMode: 'LOAD_RATIO',
      exerciseIds: ['bench-press'],
      targetPct: 1.0,
    };

    const testRole: Role = {
      id: 'pull_horizontal',
      name: 'Pull Horizontal',
      evaluationMode: 'LOAD_RATIO',
      anchorRoleId: 'push_horizontal',
      exerciseIds: ['barbell-row'],
      targetPct: 1.0,
    };

    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 100 }),
      createPerformance({ exerciseId: 'barbell-row', estimated1RM: 90 }), // 90%
    ];

    const anchorPerf = getBestPerformance(anchorRole, performances, userData);
    const evaluation = evaluateRole(testRole, performances, userData, anchorPerf?.value);

    expect(evaluation).not.toBeNull();
    expect(evaluation!.classification).toBe('WEAK');
    expect(evaluation!.currentValue).toBe(0.9);
    expect(evaluation!.pctOfTarget).toBe(0.9);
  });

  it('deve avaliar BODYWEIGHT_RATIO corretamente (ex: pull-up = 85% BW)', () => {
    const testRole: Role = {
      id: 'pull_vertical',
      name: 'Pull Vertical',
      evaluationMode: 'BODYWEIGHT_RATIO',
      exerciseIds: ['pull-up', 'chin-up'],
      targetPct: 0.85, // 85% BW
    };

    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'pull-up', loadKg: 68 }), // 85% de 80kg
    ];

    const evaluation = evaluateRole(testRole, performances, userData);

    expect(evaluation).not.toBeNull();
    expect(evaluation!.classification).toBe('BALANCED');
    expect(evaluation!.currentValue).toBeCloseTo(0.85, 2); // 68/80 = 0.85
    expect(evaluation!.targetValue).toBe(0.85);
    expect(evaluation!.pctOfTarget).toBe(1.0);
  });

  it('deve classificar BORDERLINE para pull-up a 82% BW (5% abaixo de 85%)', () => {
    const testRole: Role = {
      id: 'pull_vertical',
      name: 'Pull Vertical',
      evaluationMode: 'BODYWEIGHT_RATIO',
      exerciseIds: ['pull-up'],
      targetPct: 0.85,
    };

    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'pull-up', loadKg: 65.6 }), // 82% de 80kg
    ];

    const evaluation = evaluateRole(testRole, performances, userData);

    expect(evaluation).not.toBeNull();
    expect(evaluation!.classification).toBe('BORDERLINE');
    expect(evaluation!.currentValue).toBeCloseTo(0.82, 2);
    expect(evaluation!.pctOfTarget).toBeCloseTo(0.9647, 3); // 0.82/0.85
  });

  it('deve classificar WEAK para pull-up a 80% BW', () => {
    const testRole: Role = {
      id: 'pull_vertical',
      name: 'Pull Vertical',
      evaluationMode: 'BODYWEIGHT_RATIO',
      exerciseIds: ['pull-up'],
      targetPct: 0.85,
    };

    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'pull-up', loadKg: 64 }), // 80% de 80kg
    ];

    const evaluation = evaluateRole(testRole, performances, userData);

    expect(evaluation).not.toBeNull();
    expect(evaluation!.classification).toBe('WEAK');
    expect(evaluation!.currentValue).toBe(0.8);
    expect(evaluation!.pctOfTarget).toBeCloseTo(0.941, 3);
  });

  it('deve avaliar REP_COUNT corretamente (ex: push-ups = 20 reps)', () => {
    const testRole: Role = {
      id: 'pushups',
      name: 'Push-ups',
      evaluationMode: 'REP_COUNT',
      exerciseIds: ['push-up'],
      repsTarget: 20,
    };

    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'push-up', reps: 20 }),
    ];

    const evaluation = evaluateRole(testRole, performances, userData);

    expect(evaluation).not.toBeNull();
    expect(evaluation!.classification).toBe('BALANCED');
    expect(evaluation!.currentValue).toBe(20);
    expect(evaluation!.targetValue).toBe(20);
    expect(evaluation!.pctOfTarget).toBe(1.0);
  });

  it('deve usar repsTargetFemale para mulheres em REP_COUNT', () => {
    const testRole: Role = {
      id: 'pushups',
      name: 'Push-ups',
      evaluationMode: 'REP_COUNT',
      exerciseIds: ['push-up'],
      repsTarget: 20,
      repsTargetFemale: 15,
    };

    const femaleUserData = createUserData({ sex: 'female' });
    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'push-up', reps: 15 }),
    ];

    const evaluation = evaluateRole(testRole, performances, femaleUserData);

    expect(evaluation).not.toBeNull();
    expect(evaluation!.classification).toBe('BALANCED');
    expect(evaluation!.targetValue).toBe(15);
  });

  it('deve retornar null quando não há âncora para LOAD_RATIO', () => {
    const testRole: Role = {
      id: 'pull_horizontal',
      name: 'Pull Horizontal',
      evaluationMode: 'LOAD_RATIO',
      anchorRoleId: 'push_horizontal',
      exerciseIds: ['barbell-row'],
      targetPct: 1.0,
    };

    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'barbell-row', estimated1RM: 100 }),
    ];

    // Sem anchorValue
    const evaluation = evaluateRole(testRole, performances, userData, undefined);

    expect(evaluation).toBeNull();
  });

  it('deve retornar null quando não há dados de performance', () => {
    const testRole: Role = {
      id: 'pull_horizontal',
      name: 'Pull Horizontal',
      evaluationMode: 'LOAD_RATIO',
      anchorRoleId: 'push_horizontal',
      exerciseIds: ['barbell-row'],
      targetPct: 1.0,
    };

    const performances: ExercisePerformance[] = []; // vazio

    const evaluation = evaluateRole(testRole, performances, userData, 100);

    expect(evaluation).toBeNull();
  });
});

describe('evaluateStructuralBalance — Avaliação completa', () => {
  const userData = createUserData({ bodyweightKg: 80 });

  it('deve avaliar todos os roles do template BALANCE_TEMPLATES', () => {
    // Simula um atleta equilibrado
    const performances: ExercisePerformance[] = [
      // Push horizontal (âncora) - 100kg bench
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 100 }),
      // Push vertical - 66kg OHP (66% do bench)
      createPerformance({ exerciseId: 'overhead-press', estimated1RM: 66 }),
      // Pull horizontal - 100kg row (100% do bench)
      createPerformance({ exerciseId: 'barbell-row', estimated1RM: 100 }),
      // Pull vertical - 68kg pull-up (85% BW)
      createPerformance({ exerciseId: 'pull-up', loadKg: 68 }),
      // Knee dominant - 140kg squat
      createPerformance({ exerciseId: 'back-squat', estimated1RM: 140 }),
      // Hip dominant - 140kg deadlift (100% do squat)
      createPerformance({ exerciseId: 'deadlift', estimated1RM: 140 }),
      // Core
      createPerformance({ exerciseId: 'plank', reps: 60 }),
      createPerformance({ exerciseId: 'pallof-press', reps: 30 }),
      // Carry
      createPerformance({ exerciseId: 'farmers-walk', loadKg: 40 }), // 50% BW
    ];

    const result = evaluateStructuralBalance(BALANCE_TEMPLATES, performances, userData);

    expect(result.evaluations.length).toBeGreaterThan(0);
    expect(result.summary.total).toBe(result.evaluations.length);
    expect(result.summary.balanced + result.summary.borderline + result.summary.weak).toBe(result.summary.total);

    // Verifica se todos estão BALANCED (atleta equilibrado)
    expect(result.summary.weak).toBe(0);
    expect(result.summary.borderline).toBe(0);
    expect(result.summary.balanced).toBe(result.summary.total);
  });

  it('deve detectar desequilíbrios (pull fraco, push forte)', () => {
    const performances: ExercisePerformance[] = [
      // Push horizontal forte - 120kg bench
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 120 }),
      // Push vertical - 80kg OHP (66.7% de 120, acima do target 66%)
      createPerformance({ exerciseId: 'overhead-press', estimated1RM: 80 }),
      // Pull horizontal FRACO - 90kg row (75% do bench, alvo 100%)
      createPerformance({ exerciseId: 'barbell-row', estimated1RM: 90 }),
      // Pull vertical - 68kg pull-up (85% BW)
      createPerformance({ exerciseId: 'pull-up', loadKg: 68 }),
      // Lower body
      createPerformance({ exerciseId: 'back-squat', estimated1RM: 140 }),
      createPerformance({ exerciseId: 'deadlift', estimated1RM: 140 }),
      // Core
      createPerformance({ exerciseId: 'plank', reps: 60 }),
      createPerformance({ exerciseId: 'pallof-press', reps: 30 }),
      createPerformance({ exerciseId: 'farmers-walk', loadKg: 40 }),
    ];

    const result = evaluateStructuralBalance(BALANCE_TEMPLATES, performances, userData);

    // Pull horizontal deve ser WEAK (90/120 = 0.75, alvo 1.0 = 75% do alvo)
    const pullHorizontal = result.evaluations.find((e) => e.roleId === 'pull_horizontal');
    expect(pullHorizontal).not.toBeUndefined();
    expect(pullHorizontal!.classification).toBe('WEAK');

    // Push vertical deve ser BALANCED (79/120 = 0.658 ~ 66% target)
    const pushVertical = result.evaluations.find((e) => e.roleId === 'push_vertical');
    expect(pushVertical).not.toBeUndefined();
    expect(pushVertical!.classification).toBe('BALANCED');

    // Nota: push_horizontal e ancor nao aparece nas avaliacoes (e a referencia)
  });

  it('deve classificar BORDERLINE corretamente (ex: 97% do alvo)', () => {
    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 100 }),
      createPerformance({ exerciseId: 'overhead-press', estimated1RM: 66 }),
      // Pull horizontal = 97kg (97% do bench, alvo 100%)
      createPerformance({ exerciseId: 'barbell-row', estimated1RM: 97 }),
      createPerformance({ exerciseId: 'pull-up', loadKg: 68 }),
      createPerformance({ exerciseId: 'back-squat', estimated1RM: 140 }),
      createPerformance({ exerciseId: 'deadlift', estimated1RM: 140 }),
      createPerformance({ exerciseId: 'plank', reps: 60 }),
      createPerformance({ exerciseId: 'pallof-press', reps: 30 }),
      createPerformance({ exerciseId: 'farmers-walk', loadKg: 40 }),
    ];

    const result = evaluateStructuralBalance(BALANCE_TEMPLATES, performances, userData);

    const pullHorizontal = result.evaluations.find((e) => e.roleId === 'pull_horizontal');
    expect(pullHorizontal).not.toBeUndefined();
    expect(pullHorizontal!.classification).toBe('BORDERLINE');
    expect(pullHorizontal!.currentValue).toBe(0.97);
  });

  it('deve resumir corretamente: balanced, borderline, weak', () => {
    const performances: ExercisePerformance[] = [
      createPerformance({ exerciseId: 'bench-press', estimated1RM: 100 }),
      createPerformance({ exerciseId: 'overhead-press', estimated1RM: 66 }),
      // WEAK: 85kg row (85% do bench)
      createPerformance({ exerciseId: 'barbell-row', estimated1RM: 85 }),
      // BALANCED: 68kg pull-up (85% BW)
      createPerformance({ exerciseId: 'pull-up', loadKg: 68 }),
      // BORDERLINE: 133kg deadlift (95% do squat 140)
      createPerformance({ exerciseId: 'back-squat', estimated1RM: 140 }),
      createPerformance({ exerciseId: 'deadlift', estimated1RM: 133 }),
      createPerformance({ exerciseId: 'plank', reps: 60 }),
      createPerformance({ exerciseId: 'pallof-press', reps: 30 }),
      createPerformance({ exerciseId: 'farmers-walk', loadKg: 40 }),
    ];

    const result = evaluateStructuralBalance(BALANCE_TEMPLATES, performances, userData);

    expect(result.summary.weak).toBeGreaterThanOrEqual(1);
    expect(result.summary.borderline).toBeGreaterThanOrEqual(1);
    expect(result.summary.balanced).toBeGreaterThanOrEqual(1);
    expect(result.summary.total).toBe(
      result.summary.weak + result.summary.borderline + result.summary.balanced
    );
  });
});

describe('BALANCE_TEMPLATES — Templates pré-definidos', () => {
  it('deve conter roles principais', () => {
    const ids = BALANCE_TEMPLATES.map((t) => t.id);

    expect(ids).toContain('push_horizontal');
    expect(ids).toContain('push_vertical');
    expect(ids).toContain('pull_horizontal');
    expect(ids).toContain('pull_vertical');
    expect(ids).toContain('knee_dominant');
    expect(ids).toContain('hip_dominant');
  });

  it('deve ter push_horizontal como âncora (sem anchorRoleId, LOAD_RATIO)', () => {
    const pushHorizontal = BALANCE_TEMPLATES.find((t) => t.id === 'push_horizontal');

    expect(pushHorizontal).not.toBeUndefined();
    expect(pushHorizontal!.anchorRoleId).toBeUndefined();
    expect(pushHorizontal!.evaluationMode).toBe('LOAD_RATIO');
    expect(pushHorizontal!.targetPct).toBe(1.0);
  });

  it('deve ter push_vertical com anchorRoleId = push_horizontal e target 66%', () => {
    const pushVertical = BALANCE_TEMPLATES.find((t) => t.id === 'push_vertical');

    expect(pushVertical).not.toBeUndefined();
    expect(pushVertical!.anchorRoleId).toBe('push_horizontal');
    expect(pushVertical!.targetPct).toBe(0.66);
  });

  it('deve ter pull_horizontal com anchorRoleId = push_horizontal e target 100%', () => {
    const pullHorizontal = BALANCE_TEMPLATES.find((t) => t.id === 'pull_horizontal');

    expect(pullHorizontal).not.toBeUndefined();
    expect(pullHorizontal!.anchorRoleId).toBe('push_horizontal');
    expect(pullHorizontal!.targetPct).toBe(1.0);
  });

  it('deve ter pull_vertical como BODYWEIGHT_RATIO com target 85%', () => {
    const pullVertical = BALANCE_TEMPLATES.find((t) => t.id === 'pull_vertical');

    expect(pullVertical).not.toBeUndefined();
    expect(pullVertical!.evaluationMode).toBe('BODYWEIGHT_RATIO');
    expect(pullVertical!.targetPct).toBe(0.85);
  });

  it('deve ter hip_dominant com anchorRoleId = knee_dominant e target 100%', () => {
    const hipDominant = BALANCE_TEMPLATES.find((t) => t.id === 'hip_dominant');
    const kneeDominant = BALANCE_TEMPLATES.find((t) => t.id === 'knee_dominant');

    expect(hipDominant).not.toBeUndefined();
    expect(hipDominant!.anchorRoleId).toBe('knee_dominant');
    expect(hipDominant!.targetPct).toBe(1.0);
    expect(kneeDominant).not.toBeUndefined();
    expect(kneeDominant!.anchorRoleId).toBeUndefined();
  });

  it('deve ter core_anti_extension com REP_COUNT e targets diferenciados por sexo', () => {
    const core = BALANCE_TEMPLATES.find((t) => t.id === 'core_anti_extension');

    expect(core).not.toBeUndefined();
    expect(core!.evaluationMode).toBe('REP_COUNT');
    expect(core!.repsTarget).toBe(60);
    expect(core!.repsTargetFemale).toBe(45);
  });

  it('deve ter carry com BODYWEIGHT_RATIO target 50%', () => {
    const carry = BALANCE_TEMPLATES.find((t) => t.id === 'carry');

    expect(carry).not.toBeUndefined();
    expect(carry!.evaluationMode).toBe('BODYWEIGHT_RATIO');
    expect(carry!.targetPct).toBe(0.5);
  });
});