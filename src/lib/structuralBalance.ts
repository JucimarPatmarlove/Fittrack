// Mapa Muscular / Structural Balance — inspirado no openGym
// Funções puras, sem React, TypeScript estrito

/**
 * Modo de avaliação do equilíbrio estrutural
 * - LOAD_RATIO: compara carga (1RM estimado) entre exercícios (ex: bench vs row = 100%)
 * - BODYWEIGHT_RATIO: compara carga com peso corporal (ex: pull-up = 85% BW)
 * - REP_COUNT: compara número de repetições em exercício de peso corporal (ex: push-ups = 20 reps)
 */
export type MetricType = 'LOAD_RATIO' | 'BODYWEIGHT_RATIO' | 'REP_COUNT';

/**
 * Classificação do equilíbrio
 * - BALANCED: atinge ou excede o alvo
 * - BORDERLINE: até 5% abaixo do alvo
 * - WEAK: mais de 5% abaixo do alvo
 */
export type BalanceClassification = 'BALANCED' | 'BORDERLINE' | 'WEAK';

/**
 * Papel (role) no mapa muscular
 * Define como avaliar e qual o alvo para este padrão de movimento
 */
export type Role = {
  /** Identificador único do role (ex: 'push_horizontal', 'pull_vertical') */
  id: string;
  /** Nome legível para UI */
  name: string;
  /** Modo de avaliação */
  evaluationMode: MetricType;
  /** Role âncora para LOAD_RATIO (ex: 'push_horizontal' para 'pull_horizontal') */
  anchorRoleId?: string;
  /** IDs de exercícios que pertencem a este role (whitelist) */
  exerciseIds: string[];
  /** Alvo percentual para LOAD_RATIO ou BODYWEIGHT_RATIO (ex: 0.85 = 85%) */
  targetPct?: number;
  /** Alvo de repetições para REP_COUNT */
  repsTarget?: number;
  /** Alvo de repetições para mulheres (REP_COUNT) - opcional */
  repsTargetFemale?: number;
};

/**
 * Dados do utilizador necessários para avaliação
 */
export type UserData = {
  /** Peso corporal em kg */
  bodyweightKg: number;
  /** Sexo do utilizador (para targets diferenciados em REP_COUNT) */
  sex?: 'male' | 'female';
};

/**
 * Dados de desempenho de um exercício específico
 */
export type ExercisePerformance = {
  /** ID do exercício */
  exerciseId: string;
  /** 1RM estimado em kg (para LOAD_RATIO) */
  estimated1RM?: number;
  /** Carga usada em kg (para BODYWEIGHT_RATIO com assistência) */
  loadKg?: number;
  /** Repetições completadas (para REP_COUNT) */
  reps?: number;
  /** Se é exercício unilateral (usa melhor lado) */
  isUnilateral?: boolean;
  /** Lado (para unilaterais) */
  side?: 'left' | 'right';
};

/**
 * Resultado da avaliação de um role
 */
export type RoleEvaluation = {
  /** ID do role avaliado */
  roleId: string;
  /** Nome do role */
  roleName: string;
  /** Classificação final */
  classification: BalanceClassification;
  /** Valor atual (ratio ou reps) */
  currentValue: number;
  /** Valor alvo */
  targetValue: number;
  /** Percentagem do alvo atingida (0-1+) */
  pctOfTarget: number;
  /** Exercício usado para a avaliação (o melhor) */
  bestExerciseId: string;
  /** Explicação legível */
  reason: string;
};

/**
 * Resultado completo da avaliação de equilíbrio estrutural
 */
export type StructuralBalanceResult = {
  /** Avaliações por role */
  evaluations: RoleEvaluation[];
  /** Resumo global */
  summary: {
    balanced: number;
    borderline: number;
    weak: number;
    total: number;
  };
};

/**
 * Calcula a classificação baseada na percentagem do alvo atingida
 */
export function classifyBalance(pctOfTarget: number): BalanceClassification {
  if (pctOfTarget >= 1.0) return 'BALANCED';
  if (pctOfTarget >= 0.95) return 'BORDERLINE';
  return 'WEAK';
}

/**
 * Obtém o melhor desempenho para um role a partir dos exercícios disponíveis
 * Para unilaterais, usa o melhor lado
 */
export function getBestPerformance(
  role: Role,
  performances: ExercisePerformance[],
  userData: UserData
): { value: number; exerciseId: string; metricType: MetricType } | null {
  const relevantPerformances = performances.filter((p) => role.exerciseIds.includes(p.exerciseId));

  if (relevantPerformances.length === 0) return null;

  // Para cada exercício, calcula o valor conforme o modo de avaliação
  const evaluated = relevantPerformances.map((p) => {
    let value: number;

    switch (role.evaluationMode) {
      case 'LOAD_RATIO':
        // Usa 1RM estimado
        value = p.estimated1RM ?? 0;
        break;
      case 'BODYWEIGHT_RATIO':
        // Usa carga (peso corporal - assistência para máquinas assistidas)
        value = p.loadKg ?? 0;
        break;
      case 'REP_COUNT':
        // Usa repetições
        value = p.reps ?? 0;
        break;
    }

    return { value, exerciseId: p.exerciseId };
  });

  // Para unilaterais, agrupa por exercício base e pega o melhor lado
  // Simplificação: pega o máximo valor entre todos
  const best = evaluated.reduce((max, curr) =>
    curr.value > max.value ? curr : max
  , evaluated[0]);

  if (best.value <= 0) return null;

  return {
    value: best.value,
    exerciseId: best.exerciseId,
    metricType: role.evaluationMode,
  };
}

/**
 * Avalia um único role contra os dados do utilizador
 */
export function evaluateRole(
  role: Role,
  performances: ExercisePerformance[],
  userData: UserData,
  anchorValue?: number // Valor do role âncora (para LOAD_RATIO)
): RoleEvaluation | null {
  const bestPerf = getBestPerformance(role, performances, userData);

  if (!bestPerf) {
    return null; // Sem dados para avaliar
  }

  let currentValue: number;
  let targetValue: number;
  let reason: string;

  switch (role.evaluationMode) {
    case 'LOAD_RATIO': {
      // Ratio = valor atual / valor âncora
      // Ex: pull_horizontal / push_horizontal = 1.0 (100%)
      if (!anchorValue || anchorValue <= 0) {
        return null; // Não pode calcular sem âncora
      }
      currentValue = bestPerf.value / anchorValue;
      targetValue = role.targetPct ?? 1.0;
      const pct = (currentValue / targetValue) * 100;
      reason = `${bestPerf.exerciseId}: ${(currentValue * 100).toFixed(1)}% do ${role.anchorRoleId} (alvo: ${(targetValue * 100).toFixed(0)}%)`;
      return {
        roleId: role.id,
        roleName: role.name,
        classification: classifyBalance(currentValue / targetValue),
        currentValue,
        targetValue,
        pctOfTarget: currentValue / targetValue,
        bestExerciseId: bestPerf.exerciseId,
        reason,
      };
    }

    case 'BODYWEIGHT_RATIO': {
      // Ratio = carga / peso corporal
      // Ex: pull-up com 85% BW
      currentValue = bestPerf.value / userData.bodyweightKg;
      targetValue = role.targetPct ?? 1.0;
      reason = `${bestPerf.exerciseId}: ${(currentValue * 100).toFixed(1)}% BW (alvo: ${(targetValue * 100).toFixed(0)}%)`;
      return {
        roleId: role.id,
        roleName: role.name,
        classification: classifyBalance(currentValue / targetValue),
        currentValue,
        targetValue,
        pctOfTarget: currentValue / targetValue,
        bestExerciseId: bestPerf.exerciseId,
        reason,
      };
    }

    case 'REP_COUNT': {
      // Compara repetições com alvo
      currentValue = bestPerf.value;
      const targetReps = userData.sex === 'female' && role.repsTargetFemale !== undefined
        ? role.repsTargetFemale
        : role.repsTarget ?? 0;
      targetValue = targetReps;
      reason = `${bestPerf.exerciseId}: ${currentValue} reps (alvo: ${targetReps} reps)`;
      return {
        roleId: role.id,
        roleName: role.name,
        classification: classifyBalance(currentValue / targetValue),
        currentValue,
        targetValue,
        pctOfTarget: currentValue / targetValue,
        bestExerciseId: bestPerf.exerciseId,
        reason,
      };
    }
  }
}

/**
 * Avalia o equilíbrio estrutural completo
 *
 * @param roles - Lista de roles a avaliar (ex: BALANCE_TEMPLATES)
 * @param performances - Desempenho do utilizador nos exercícios
 * @param userData - Dados do utilizador (peso corporal, sexo)
 * @returns Resultado completo com classificações por role
 */
export function evaluateStructuralBalance(
  roles: Role[],
  performances: ExercisePerformance[],
  userData: UserData
): StructuralBalanceResult {
  // Primeiro, calcula valores de âncora para roles LOAD_RATIO
  const anchorValues = new Map<string, number>();

  // Identifica roles que servem de âncora (não têm anchorRoleId)
  const anchorRoles = roles.filter((r) => !r.anchorRoleId && r.evaluationMode === 'LOAD_RATIO');

  for (const anchorRole of anchorRoles) {
    const bestPerf = getBestPerformance(anchorRole, performances, userData);
    if (bestPerf) {
      anchorValues.set(anchorRole.id, bestPerf.value);
    }
  }

  // Avalia todos os roles
  const evaluations: RoleEvaluation[] = [];

  for (const role of roles) {
    let anchorValue: number | undefined;

    if (role.evaluationMode === 'LOAD_RATIO' && role.anchorRoleId) {
      anchorValue = anchorValues.get(role.anchorRoleId);
    }

    const evaluation = evaluateRole(role, performances, userData, anchorValue);
    if (evaluation) {
      evaluations.push(evaluation);
    }
  }

  // Conta classificações
  const summary = {
    balanced: evaluations.filter((e) => e.classification === 'BALANCED').length,
    borderline: evaluations.filter((e) => e.classification === 'BORDERLINE').length,
    weak: evaluations.filter((e) => e.classification === 'WEAK').length,
    total: evaluations.length,
  };

  return { evaluations, summary };
}

/**
 * Templates pré-definidos de equilíbrio estrutural (estilo Poliquin/ATG)
 * Baseado no openGym structuralBalanceTemplates.js
 */
export const BALANCE_TEMPLATES: Role[] = [
  // Âncoras (push_horizontal é a referência principal para upper body)
  {
    id: 'push_horizontal',
    name: 'Empurrar Horizontal',
    evaluationMode: 'LOAD_RATIO',
    exerciseIds: ['bench-press', 'db-bench-press', 'push-up-loaded', 'machine-chest-press'],
    targetPct: 1.0, // 100% = referência
  },
  {
    id: 'push_vertical',
    name: 'Empurrar Vertical',
    evaluationMode: 'LOAD_RATIO',
    anchorRoleId: 'push_horizontal',
    exerciseIds: ['overhead-press', 'db-overhead-press', 'machine-shoulder-press', 'pike-push-up'],
    targetPct: 0.66, // 66% do bench press
  },

  // Pulls comparados com pushes
  {
    id: 'pull_horizontal',
    name: 'Puxar Horizontal',
    evaluationMode: 'LOAD_RATIO',
    anchorRoleId: 'push_horizontal',
    exerciseIds: ['barbell-row', 'db-row', 'cable-row', 'machine-row', 'chest-supported-row'],
    targetPct: 1.0, // 100% do bench press
  },
  {
    id: 'pull_vertical',
    name: 'Puxar Vertical',
    evaluationMode: 'BODYWEIGHT_RATIO',
    exerciseIds: ['pull-up', 'chin-up', 'lat-pulldown', 'assisted-pull-up'],
    targetPct: 0.85, // 85% do peso corporal
  },

  // Lower body
  {
    id: 'knee_dominant',
    name: 'Dominante de Joelho',
    evaluationMode: 'LOAD_RATIO',
    exerciseIds: ['back-squat', 'front-squat', 'goblet-squat', 'leg-press', 'bulgarian-split-squat'],
    targetPct: 1.0, // Referência própria
  },
  {
    id: 'hip_dominant',
    name: 'Dominante de Anca',
    evaluationMode: 'LOAD_RATIO',
    anchorRoleId: 'knee_dominant',
    exerciseIds: ['deadlift', 'rdl', 'hip-thrust', 'glute-bridge', 'good-morning'],
    targetPct: 1.0, // 100% do agachamento
  },

  // Unilaterais / Core / Carry
  {
    id: 'unilateral_push',
    name: 'Empurrar Unilateral',
    evaluationMode: 'LOAD_RATIO',
    anchorRoleId: 'push_horizontal',
    exerciseIds: ['single-arm-db-press', 'single-arm-push-up', 'landmine-press'],
    targetPct: 0.5, // 50% do bilateral (por lado)
  },
  {
    id: 'unilateral_pull',
    name: 'Puxar Unilateral',
    evaluationMode: 'LOAD_RATIO',
    anchorRoleId: 'push_horizontal',
    exerciseIds: ['single-arm-row', 'meadows-row', 'single-arm-pulldown'],
    targetPct: 0.5, // 50% do bilateral (por lado)
  },
  {
    id: 'core_anti_extension',
    name: 'Core Anti-Extensão',
    evaluationMode: 'REP_COUNT',
    exerciseIds: ['plank', 'ab-wheel-rollout', 'dead-bug'],
    repsTarget: 60, // 60 segundos
    repsTargetFemale: 45,
  },
  {
    id: 'core_anti_rotation',
    name: 'Core Anti-Rotação',
    evaluationMode: 'REP_COUNT',
    exerciseIds: ['pallof-press', 'bird-dog', 'side-plank'],
    repsTarget: 30, // 30 segundos por lado
    repsTargetFemale: 20,
  },
  {
    id: 'carry',
    name: 'Loaded Carry',
    evaluationMode: 'BODYWEIGHT_RATIO',
    exerciseIds: ['farmers-walk', 'suitcase-carry', 'waiter-carry'],
    targetPct: 0.5, // 50% BW por mão
  },
];

/**
 * Obtém template por ID
 */
export function getBalanceTemplate(id: string): Role | undefined {
  return BALANCE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Obtém todos os templates de uma categoria
 */
export function getBalanceTemplatesByMode(mode: MetricType): Role[] {
  return BALANCE_TEMPLATES.filter((t) => t.evaluationMode === mode);
}