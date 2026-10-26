// Structural Balance Widget — Mapa Muscular / Radar de Equilíbrio
import { useMemo } from 'react';
import {
  evaluateStructuralBalance,
  BALANCE_TEMPLATES,
  type ExercisePerformance,
  type UserData,
  type RoleEvaluation,
} from '../../lib/structuralBalance';
import type { WorkoutSessionData } from '../../utils/schemas';
import { C } from '../../data/constants';

interface StructuralBalanceWidgetProps {
  /** Histórico de sessões do utilizador */
  history: WorkoutSessionData[];
  /** Peso corporal actual em kg */
  bodyweight: number;
  /** Sexo do utilizador (para targets diferenciados) */
  sex?: 'male' | 'female';
  /** Título da secção */
  title?: string;
  /** Mostrar apenas roles com dados disponíveis */
  showOnlyWithData?: boolean;
}

// Mapeamento de roleId para ícones
const ROLE_ICONS: Record<string, string> = {
  push_horizontal: '🤸‍♂️',
  push_vertical: '🏋️‍♂️',
  pull_horizontal: '🚣‍♂️',
  pull_vertical: '🧗‍♂️',
  knee_dominant: '🦵',
  hip_dominant: '🍑',
  unilateral_push: '🤸‍♀️',
  unilateral_pull: '🏋️‍♀️',
  core_anti_extension: '🧘‍♂️',
  core_anti_rotation: '🤸',
  carry: '🧳',
};

// Mapeamento de roleId para dicas acionáveis
const ROLE_TIPS: Record<string, string> = {
  pull_horizontal: 'Adiciona mais séries de remada (barbell row, cable row, db row)',
  pull_vertical: 'Trabalha pull-ups/chin-ups; usa bandas ou máquina assistida se necessário',
  push_vertical: 'Prioriza overhead press e variações (pike push-up, landmine press)',
  knee_dominant: 'Foca em agachamentos (back squat, front squat, goblet squat, bulgarian split squat)',
  hip_dominant: 'Inclui deadlifts, RDLs, hip thrusts e good mornings',
  unilateral_push: 'Adiciona single-arm dumbbell press, landmine press ou single-arm push-up',
  unilateral_pull: 'Trabalha single-arm rows, meadows rows, single-arm pulldowns',
  core_anti_extension: 'Pratica planks, ab-wheel rollouts e dead bugs',
  core_anti_rotation: 'Inclui pallof press, bird-dog e side planks',
  carry: 'Adiciona farmer\'s walks, suitcase carries e waiter carries',
};

// Cores por classificação
const CLASSIFICATION_COLORS: Record<'BALANCED' | 'BORDERLINE' | 'WEAK', { bg: string; border: string; text: string }> = {
  BALANCED: {
    bg: 'rgba(34, 197, 94, 0.15)',
    border: '#22c55e',
    text: '#22c55e',
  },
  BORDERLINE: {
    bg: 'rgba(234, 179, 8, 0.15)',
    border: '#eab308',
    text: '#eab308',
  },
  WEAK: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: '#ef4444',
    text: '#ef4444',
  },
};

// Converte histórico de sessões (WorkoutSessionData) em ExercisePerformance
function historyToPerformances(history: WorkoutSessionData[]): ExercisePerformance[] {
  // Agrupa sessões por exerciseId (usa name como ID) e pega a melhor performance
  const bestByExercise = new Map<string, ExercisePerformance>();

  for (const workout of history) {
    for (const exercise of workout.exercises) {
      const exerciseId = exercise.name.toLowerCase().replace(/\s+/g, '-');
      const sets = exercise.sets;

      // Filtra apenas séries weighted (com weight e reps)
      const workSets = sets.filter((s): s is { type: 'weighted'; weight: number; reps: number; done: boolean; isWarmup?: boolean } =>
        s.type === 'weighted' && !s.isWarmup && s.done === true && (s.reps ?? 0) > 0
      );

      if (workSets.length === 0) continue;

      // Calcula 1RM estimado usando fórmula de Epley: weight * (1 + reps/30)
      const bestSet = workSets.reduce((best, current) => {
        const current1RM = current.weight * (1 + current.reps / 30);
        const best1RM = best.weight * (1 + best.reps / 30);
        return current1RM > best1RM ? current : best;
      });

      const estimated1RM = bestSet.weight * (1 + bestSet.reps / 30);

      // Para exercícios de peso corporal, a carga é o peso corporal (addedWeight)
      const isBodyweight = exercise.type === 'bodyweight';
      const loadKg = isBodyweight ? bestSet.weight : undefined;

      const existing = bestByExercise.get(exerciseId);
      if (!existing || (estimated1RM > (existing.estimated1RM ?? 0))) {
        bestByExercise.set(exerciseId, {
          exerciseId,
          estimated1RM,
          loadKg,
          reps: bestSet.reps,
          isUnilateral: false, // TODO: detectar a partir do exerciseId
        });
      }
    }
  }

  return Array.from(bestByExercise.values());
}

export default function StructuralBalanceWidget({
  history,
  bodyweight,
  sex = 'male',
  title = 'Equilíbrio Muscular',
  showOnlyWithData = true,
}: StructuralBalanceWidgetProps) {
  const evaluations = useMemo(() => {
    if (!bodyweight || bodyweight <= 0) return [];
    if (!history || history.length === 0) return [];

    const performances = historyToPerformances(history);
    const userData: UserData = { bodyweightKg: bodyweight, sex };
    const result = evaluateStructuralBalance(BALANCE_TEMPLATES, performances, userData);
    return result.evaluations;
  }, [history, bodyweight, sex]);

  const filteredEvaluations = showOnlyWithData
    ? evaluations.filter((e) => e.currentValue > 0)
    : evaluations;

  if (filteredEvaluations.length === 0) {
    return (
      <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
          Treina mais para ver o teu mapa muscular
        </p>
        <p style={{ color: C.muted, marginTop: 4, fontSize: 12 }}>
          Precisas de sessões registadas com carga/reps para calcular o equilíbrio
        </p>
      </div>
    );
  }

  // Agrupa por categoria para melhor organização
  const upperBodyRoles = ['push_horizontal', 'push_vertical', 'pull_horizontal', 'pull_vertical', 'unilateral_push', 'unilateral_pull'];
  const lowerBodyRoles = ['knee_dominant', 'hip_dominant'];
  const coreCarryRoles = ['core_anti_extension', 'core_anti_rotation', 'carry'];

  const groupedEvaluations = [
    { title: 'Superior', roles: upperBodyRoles },
    { title: 'Inferior', roles: lowerBodyRoles },
    { title: 'Core & Carry', roles: coreCarryRoles },
  ].map((group) => ({
    ...group,
    evaluations: filteredEvaluations.filter((e) => group.roles.includes(e.roleId)),
  })).filter((g) => g.evaluations.length > 0);

  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 600 }}>{title}</h2>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Mono, monospace' }}>
          {filteredEvaluations.length} padrões avaliados
        </span>
      </div>

      {groupedEvaluations.map((group, index) => (
        <div key={group.title} style={{ marginBottom: index === groupedEvaluations.length - 1 ? 0 : 20 }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>
            {group.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.evaluations.map((evaluation) => (
              <RoleBar key={evaluation.roleId} evaluation={evaluation} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface RoleBarProps {
  evaluation: RoleEvaluation;
}

function RoleBar({ evaluation }: RoleBarProps) {
  const { roleId, roleName, classification, currentValue, targetValue, pctOfTarget, bestExerciseId, reason } = evaluation;
  const colors = CLASSIFICATION_COLORS[classification] ?? CLASSIFICATION_COLORS.WEAK;
  const icon = ROLE_ICONS[roleId] || '💪';
  const tip = ROLE_TIPS[roleId];
  const pctDisplay = Math.round(pctOfTarget * 100);

  const isWeak = classification === 'WEAK';

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 14,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header: ícone + nome + classificação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }} aria-hidden="true">{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{roleName}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{bestExerciseId}</div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: colors.text,
            background: `${colors.border}20`,
            padding: '4px 8px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {classification === 'BALANCED' ? '✓ Equilibrado' : classification === 'BORDERLINE' ? '⚠ Limite' : '✗ Fraco'}
        </span>
      </div>

      {/* Barra de progresso */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
          <span style={{ color: C.muted }}>Progresso</span>
          <span style={{ color: C.text, fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>
            {pctDisplay}% do alvo
          </span>
        </div>
        <div
          style={{
            height: 10,
            background: C.dim,
            borderRadius: 999,
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={Math.min(pctDisplay, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${roleName}: ${pctDisplay}% do alvo`}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(pctDisplay, 150)}%`,
              background: `linear-gradient(90deg, ${colors.border}, ${colors.text})`,
              borderRadius: 999,
              transition: 'width 0.6s ease-out',
            }}
          />
        </div>
      </div>

      {/* Detalhes: valor actual vs alvo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: isWeak && tip ? 8 : 0 }}>
        <span>Actual: <strong style={{ color: C.text }}>{currentValue.toFixed(2)}</strong></span>
        <span>Alvo: <strong style={{ color: C.text }}>{targetValue.toFixed(2)}</strong></span>
        <span>Rácio: <strong style={{ color: C.text }}>{reason}</strong></span>
      </div>

      {/* Dica acionável se WEAK */}
      {isWeak && tip && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: 10,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            fontSize: 12,
            color: '#ef4444',
          }}
        >
          <span style={{ fontSize: 14, marginTop: 1 }}>💡</span>
          <span style={{ flex: 1 }}>{tip}</span>
        </div>
      )}
    </div>
  );
}