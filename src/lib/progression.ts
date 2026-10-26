// Motor de Progressão — inspirado no openGym
// Funções puras, sem React, TypeScript estrito

export type WorkoutSet = {
  /** Carga em kg (ou lb consoante unidade do utilizador) */
  weight: number;
  /** Repetições alvo para esta série */
  targetReps: number;
  /** Repetições efetivamente completadas (0 se não feita) */
  completedReps: number;
  /** Se a série foi marcada como concluída */
  done: boolean;
  /** Se é uma série de aquecimento (não conta para progressão) */
  isWarmup: boolean;
};

export type Session = {
  /** Identificador único da sessão */
  id: string;
  /** Data ISO (YYYY-MM-DD) */
  date: string;
  /** ID do exercício */
  exerciseId: string;
  /** Séries da sessão (inclui warmups) */
  sets: WorkoutSet[];
  /** Configuração do exercício na rotina */
  config: ExerciseConfig;
};

export type ExerciseConfig = {
  /** ID do exercício */
  exerciseId: string;
  /** Número de séries de trabalho prescritas */
  sets: number;
  /** Repetições alvo (topo do intervalo) */
  reps: number;
  /** Repetições mínimas (base do intervalo) */
  repsMin: number;
  /** Incremento de carga (kg) */
  weightIncrement: number;
  /** Se o exercício usa peso corporal */
  isBodyweight: boolean;
  /** Peso atual prescrito */
  currentWeight: number;
};

export type PrescriptionKind = 'first' | 'up' | 'hold' | 'deload' | 'off';

export type Prescription = {
  /** Tipo de prescrição */
  kind: PrescriptionKind;
  /** Peso prescrito para a próxima sessão */
  weight: number;
  /** Repetições alvo para a próxima sessão */
  reps: number;
  /** Número de séries */
  sets: number;
  /** Explicação legível para o utilizador */
  reason: string;
  /** Política ativa */
  policy: 'double';
};

/**
 * Lê uma sessão honestamente e determina se foi um "hit" (sucesso) ou "miss" (falha).
 *
 * Regras (openGym):
 * - Série marcada com ≥ targetReps  → HIT
 * - Série marcada com < targetReps   → MISS (logged what you got)
 * - Série nunca marcada              → MISS (not performed)
 * - Menos séries que o prescrito     → MISS
 *
 * Uma sessão que "caiu" NUNCA avança a carga como se tivesse sucesso.
 */
export function readSession(session: Session): SessionJudgement {
  const { sets, config } = session;
  const workSets = sets.filter((s) => !s.isWarmup);
  const prescribedSets = config.sets;

  // Menos séries de trabalho que o prescrito = miss
  if (workSets.length < prescribedSets) {
    return {
      ok: false,
      completedSets: workSets.length,
      prescribedSets,
      weight: config.currentWeight,
      reason: `Apenas ${workSets.length} de ${prescribedSets} séries completadas`,
    };
  }

  // Verifica cada série de trabalho (até prescribedSets)
  const relevantSets = workSets.slice(0, prescribedSets);
  const allHit = relevantSets.every((set) => set.done && set.completedReps >= set.targetReps);

  if (!allHit) {
    const failedSet = relevantSets.find((set) => !set.done || set.completedReps < set.targetReps);
    const repsDone = failedSet?.completedReps ?? 0;
    const repsTarget = failedSet?.targetReps ?? config.reps;
    return {
      ok: false,
      completedSets: prescribedSets,
      prescribedSets,
      weight: config.currentWeight,
      reason: `Falhou: ${repsDone}/${repsTarget} reps numa série`,
    };
  }

  // Todas as séries bateram o alvo
  return {
    ok: true,
    completedSets: prescribedSets,
    prescribedSets,
    weight: config.currentWeight,
    reason: `Todas as ${prescribedSets} séries completadas com ${config.reps} reps`,
  };
}

export type SessionJudgement = {
  ok: boolean;
  completedSets: number;
  prescribedSets: number;
  weight: number;
  reason: string;
};

/**
 * Conta falhas consecutivas (stalls) no histórico.
 * Para dupla progressão, uma sessão que atingiu o TOPO do range no peso atual quebra a streak.
 */
export function countStalls(sessions: Session[], config: ExerciseConfig): number {
  let stalls = 0;
  const workSessions = sessions.filter((s) => s.config.exerciseId === config.exerciseId);

  for (let i = workSessions.length - 1; i >= 0; i--) {
    const session = workSessions[i];
    if (!session) continue;
    const judgement = readSession(session);
    if (judgement.ok) break;

    // Se mudou de peso, quebra a streak (deload não deve refletir peso mais leve)
    if (i < workSessions.length - 1) {
      const nextSession = workSessions[i + 1];
      if (nextSession && session.config.currentWeight !== nextSession.config.currentWeight) {
        break;
      }
    }

    // Dupla progressão: atingir o TOPO do range (reps >= config.reps) no peso atual quebra streak
    // Não apenas "melhor que antes" - tem de ser sucesso real no topo
    if (i < workSessions.length - 1) {
      const nextSession = workSessions[i + 1];
      if (nextSession && session.config.currentWeight === nextSession.config.currentWeight) {
        const hitTop = session.sets
          .filter(s => !s.isWarmup && s.done)
          .every(s => s.completedReps >= config.reps);
        if (hitTop) break;
      }
    }

    stalls++;
  }

  return stalls;
}

/**
 * Gera a próxima prescrição baseada no histórico (Double Progression).
 *
 * Lógica:
 * - Primeira sessão (sem histórico) → 'first' com config.base
 * - Se última sessão ok E low >= topo do range → 'up' (+peso, reps = base)
 * - Se stalls >= deloadAfter → 'deload' (-peso, reps = base)
 * - Senão → 'hold' (mesmo peso, reps = min(topo, low + step))
 */
export function nextPrescription(
  sessions: Session[],
  config: ExerciseConfig,
  options: { deloadAfter?: number; deloadFactor?: number; repStep?: number } = {}
): Prescription {
  const { deloadAfter = 3, deloadFactor = 0.9, repStep = 1 } = options;
  const { reps, repsMin, weightIncrement, currentWeight, isBodyweight, sets } = config;

  // Sem histórico → primeira sessão
  if (sessions.length === 0) {
    return {
      kind: 'first',
      weight: currentWeight,
      reps: repsMin,
      sets,
      reason: 'Primeira sessão — começa no fundo do intervalo',
      policy: 'double',
    };
  }

  const lastSession = sessions[sessions.length - 1];
  if (!lastSession) {
    // Fallback defensivo (não deveria acontecer com sessions.length > 0)
    return {
      kind: 'hold',
      weight: currentWeight,
      reps: repsMin,
      sets,
      reason: 'Sessão inválida — mantém peso atual',
      policy: 'double',
    };
  }

  const judgement = readSession(lastSession);
  const stalls = countStalls(sessions, config);

  // Bodyweight: progride em reps/séries, não em peso
  if (isBodyweight) {
    if (!judgement.ok) {
      return {
        kind: 'hold',
        weight: 0,
        reps: repsMin,
        sets,
        reason: judgement.reason,
        policy: 'double',
      };
    }
    // Subir reps até topo, depois adicionar série, depois variar exercício
    const nextReps = Math.min(reps, judgement.weight + repStep); // weight aqui é reps efetivas
    return {
      kind: 'up',
      weight: 0,
      reps: nextReps,
      sets,
      reason: `Bodyweight: subiu para ${nextReps} reps`,
      policy: 'double',
    };
  }

  // Deload por estagnação
  if (stalls >= deloadAfter) {
    const newWeight = Math.max(weightIncrement, Math.round(currentWeight * deloadFactor * 10) / 10);
    return {
      kind: 'deload',
      weight: newWeight,
      reps: repsMin,
      sets,
      reason: `Estagnou ${stalls}x — deload para ${newWeight}kg, volta a ${repsMin} reps`,
      policy: 'double',
    };
  }

  // Sucesso: atingiu topo do range em todas as séries?
  const lastWorkSets = lastSession.sets.filter(s => !s.isWarmup && s.done);
  const hitTop = judgement.ok && judgement.weight === currentWeight && lastWorkSets.length > 0
    && lastWorkSets.every(s => s.completedReps >= reps);

  if (hitTop) {
    const newWeight = currentWeight + weightIncrement;
    return {
      kind: 'up',
      weight: newWeight,
      reps: repsMin,
      sets,
      reason: `Topo do intervalo (${reps} reps) — +${weightIncrement}kg, volta a ${repsMin} reps`,
      policy: 'double',
    };
  }

  // Hold: mesmo peso, subir reps gradualmente
  const lowReps = lastWorkSets.length > 0 ? Math.min(...lastWorkSets.map(s => s.completedReps)) : repsMin;
  const targetReps = Math.min(reps, lowReps + repStep);

  return {
    kind: 'hold',
    weight: currentWeight,
    reps: targetReps,
    sets,
    reason: judgement.ok
      ? `Mantém ${currentWeight}kg, alvo ${targetReps} reps`
      : `Falhou — mantém ${currentWeight}kg, alvo ${targetReps} reps`,
    policy: 'double',
  };
}

/**
 * Aplica a prescrição a um array de séries (para UI).
 * Só toca em séries não feitas (done=false).
 */
export function applyPrescription(
  sets: WorkoutSet[],
  prescription: Prescription
): WorkoutSet[] {
  return sets.map((set) => {
    if (set.done || set.isWarmup) return set;
    return {
      ...set,
      weight: prescription.weight,
      targetReps: prescription.reps,
    };
  });
}